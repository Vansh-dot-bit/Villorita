'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DeliveryLocation {
  _id: string;
  name: string;
  isActive: boolean;
}

interface GpsContextType {
  userLat: number | null;
  userLng: number | null;
  gpsLoading: boolean;
  gpsError: string | null;
  resolvedAddress: string | null;
  isLocationServiceable: boolean | null;
  requestLocation: () => void;
  setLocationManually: (address: string) => Promise<boolean>;
  isManualPromptOpen: boolean;
  setManualPromptOpen: (b: boolean) => void;
  permissionStatus: PermissionState | 'not-supported' | null;
}

const GpsContext = createContext<GpsContextType>({
  userLat: null,
  userLng: null,
  gpsLoading: false,
  gpsError: null,
  resolvedAddress: null,
  isLocationServiceable: null,
  requestLocation: () => {},
  setLocationManually: async () => false,
  isManualPromptOpen: false,
  setManualPromptOpen: () => {},
  permissionStatus: null,
});

export function GpsProvider({ children }: { children: React.ReactNode }) {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isLocationServiceable, setIsLocationServiceable] = useState<boolean | null>(null);
  const [isManualPromptOpen, setManualPromptOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'not-supported' | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setPermissionStatus(result.state);
        result.onchange = () => setPermissionStatus(result.state);
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && !navigator.geolocation) {
       setPermissionStatus('not-supported');
    }
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      toast?.error('Geolocation is not supported by this browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        // Do not set loading to false yet, wait for geocoding
        performReverseGeocoding(lat, lng);
      },
      (error) => {
        setGpsError(error.message);
        setGpsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast?.error('Location access denied. Please allow location permissions in your browser settings (Site Settings > Location > Allow) to see accurate delivery charges.');
        } else {
          toast?.error(`Location error: ${error.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const performReverseGeocoding = async (lat: number, lng: number) => {
    try {
      // 1. Reverse Geocode via Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      
      if (!res.ok) throw new Error("Failed to reverse geocode");
      const data = await res.json();
      
      const university = data.address.university || data.address.college;
      const landmark = data.address.landmark || data.address.place;
      const specificArea = university || landmark || data.name || data.address.amenity || data.address.neighbourhood || data.address.residential || data.address.suburb;
      const broadArea = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district;
        
      const fullAddress = data.display_name;

      // Prefer showing the specific area (e.g., Chandigarh University) followed by the city
      let displayString = specificArea && specificArea !== broadArea 
          ? `${specificArea}, ${broadArea || ''}`.replace(/,\s*$/, '') 
          : (broadArea || fullAddress);
      
      // Clean up duplicates like "Chandigarh University, Chandigarh University"
      if (specificArea && broadArea && specificArea.includes(broadArea)) {
          displayString = specificArea;
      }
      setResolvedAddress(displayString);

      // 2. Fetch allowed areas
      const dbLocationsRes = await fetch('/api/delivery-locations');
      const dbLocationsData = await dbLocationsRes.json();
      
      if (dbLocationsData.success) {
          const allowedNames = dbLocationsData.locations.map((loc: DeliveryLocation) => loc.name.toLowerCase().trim());
          // Check if any of the geocoded address components match the allowed delivery locations
          const checkNames = [specificArea, broadArea, data.address.city, data.address.town, data.address.village, data.address.county, data.address.state_district].filter(Boolean).map(n => n.toLowerCase().trim());
          
          const isAllowed = checkNames.some(name => allowedNames.includes(name));
          setIsLocationServiceable(isAllowed);
      } else {
          setIsLocationServiceable(false);
      }
      
    } catch (err: any) {
      console.error("Reverse geocoding error:", err);
      // In case of error, we default to serviceable true so we don't block legitimate users unfairly due to an OSM API limit,
      // but ideally we'd want a strict check. For safety, we keep it null or true if OSM fails.
      setIsLocationServiceable(true); 
    } finally {
      setGpsLoading(false);
    }
  };

  const setLocationManually = async (address: string): Promise<boolean> => {
    try {
        setGpsLoading(true);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            setUserLat(lat);
            setUserLng(lng);
            setGpsError(null);
            await performReverseGeocoding(lat, lng);
            return true;
        } else {
            toast.error("Could not find that location. Please try rephrasing.");
            setGpsLoading(false);
            return false;
        }
    } catch (err: any) {
        toast.error("Failed to search location: " + err.message);
        setGpsLoading(false);
        return false;
    }
  };

  // Auto-request on mount
  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <GpsContext.Provider value={{ userLat, userLng, gpsLoading, gpsError, resolvedAddress, isLocationServiceable, requestLocation, setLocationManually, isManualPromptOpen, setManualPromptOpen, permissionStatus }}>
      {children}
    </GpsContext.Provider>
  );
}

export function useGps() {
  return useContext(GpsContext);
}

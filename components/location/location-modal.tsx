'use client';

import { useEffect, useState } from 'react';
import { MapPin, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/context/location-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useGps } from '@/context/gps-context';

export function LocationModal() {
  const { selectedLocation, setSelectedLocation, isLoading } = useLocation();
  const { isManualPromptOpen, setManualPromptOpen, setLocationManually } = useGps();
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false); // To prevent hydration mismatch
  const [locations, setLocations] = useState<any[]>([]);
  const [tempLocationId, setTempLocationId] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
     setIsClient(true);
  }, []);

  useEffect(() => {
    // Only fetch and show modal if client-side and context loaded
    if (!isLoading) {
      if (isManualPromptOpen || !selectedLocation) {
          setOpen(true);
          fetch('/api/delivery-locations')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setLocations(data.locations);
                }
            });
      }
    }
  }, [isLoading, selectedLocation, isManualPromptOpen]);
  
  const handleOpenChange = (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
          setManualPromptOpen(false);
      }
  };

  const handleConfirm = async () => {
    setIsSearching(true);
    let addressToSearch = "";
    
    if (tempLocationId === 'other') {
        if (!customLocation.trim()) {
            setIsSearching(false);
            return;
        }
        addressToSearch = customLocation;
    } else {
        const loc = locations.find(l => l._id === tempLocationId);
        if (loc) {
            setSelectedLocation(loc);
            addressToSearch = loc.name;
        }
    }
    
    if (addressToSearch) {
        const success = await setLocationManually(addressToSearch);
        if (success) {
            // Also update the location context so forms (like Cart) get the new area name
            if (tempLocationId === 'other') {
                setSelectedLocation({ _id: 'custom', name: addressToSearch, fee: 0 });
            }
            setOpen(false);
            setManualPromptOpen(false);
        } else {
            setShowUnavailable(true);
        }
    }
    setIsSearching(false);
  };

  // Don't render anything during SSR
  if (!isClient) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          if (!selectedLocation && !isManualPromptOpen) e.preventDefault();
      }}> 
        {showUnavailable ? (
            <div className="py-6 text-center space-y-4">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-orange-500" />
                </div>
                <DialogTitle className="text-xl">Area Not Serviceable</DialogTitle>
                <DialogDescription className="text-base text-gray-700 mt-2">
                    Oops! Delivery isn’t available in your area yet. We’re coming soon!
                </DialogDescription>
                <div className="pt-4">
                    <Button onClick={() => setShowUnavailable(false)} variant="outline" className="w-full">
                        View Available Areas
                    </Button>
                </div>
            </div>
        ) : (
            <>
                <DialogHeader>
                  <DialogTitle>Choose Delivery Location</DialogTitle>
                  <DialogDescription>
                    Please select your delivery location to see accurate pricing and availability.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Area</label>
                        <Select value={tempLocationId} onValueChange={setTempLocationId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your campus/area" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map((loc) => (
                                    <SelectItem key={loc._id} value={loc._id}>
                                        {loc.name}
                                    </SelectItem>
                                ))}
                                <SelectItem value="other" className="text-indigo-600 font-medium border-t mt-1 pt-1 rounded-none">
                                   + Other Location
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {tempLocationId === 'other' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-medium">Type your area</label>
                            <Input 
                                placeholder="Enter your city or area" 
                                value={customLocation}
                                onChange={(e) => setCustomLocation(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleConfirm} disabled={isSearching || !tempLocationId || (tempLocationId === 'other' && !customLocation.trim())} className="w-full">
                    {isSearching ? "Finding Location..." : "Confirm Location"}
                  </Button>
                </div>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}

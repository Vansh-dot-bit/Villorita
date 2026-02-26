'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface Location {
  _id: string;
  name: string;
  fee: number;
}

interface LocationContextType {
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pur_location');
    if (stored) {
      try {
        setSelectedLocation(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('pur_location');
      }
    }
    setIsLoading(false);
  }, []);

  // Update local storage when state changes
  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('pur_location', JSON.stringify(selectedLocation));
    }
  }, [selectedLocation]);

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation, isLoading }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

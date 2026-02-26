'use client';

import { useEffect, useState } from 'react';
import { MapPin, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/context/location-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LocationModal() {
  const { selectedLocation, setSelectedLocation, isLoading } = useLocation();
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false); // To prevent hydration mismatch
  const [locations, setLocations] = useState<any[]>([]);
  const [tempLocationId, setTempLocationId] = useState('');

  useEffect(() => {
     setIsClient(true);
  }, []);

  useEffect(() => {
    // Only fetch and show modal if client-side and context loaded
    if (!isLoading && !selectedLocation) {
      setOpen(true);
      fetch('/api/delivery-locations')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setLocations(data.locations);
                // Set default to Chandigarh University if available and nothing selected
                const defaultLoc = data.locations.find((l: any) => l.name.toLowerCase().includes('chandigarh university'));
                if (defaultLoc) {
                    setTempLocationId(defaultLoc._id);
                }
            }
        });
    }
  }, [isLoading, selectedLocation]);

  const handleConfirm = () => {
    const loc = locations.find(l => l._id === tempLocationId);
    if (loc) {
        setSelectedLocation(loc);
        setOpen(false);
    }
  };

  // Don't render anything during SSR
  if (!isClient) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}> 
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
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleConfirm} disabled={!tempLocationId} className="w-full">
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

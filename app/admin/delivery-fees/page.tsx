'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';

export default function DeliveryFeesPage() {
    const { token } = useAuth();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newFee, setNewFee] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchLocations = async () => {
        try {
            const res = await fetch('/api/delivery-locations');
            const data = await res.json();
            if (data.success) {
                setLocations(data.locations);
            }
        } catch (error) {
            toast.error('Failed to load locations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setAdding(true);
        try {
            const res = await fetch('/api/delivery-locations', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName, fee: newFee || 0 })
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success('Location added');
                setNewName('');
                setNewFee('');
                setLocations([...locations, data.location]);
            } else {
                toast.error(data.error || 'Failed to add location');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            const res = await fetch(`/api/delivery-locations?id=${id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Location deleted');
                setLocations(locations.filter(l => l._id !== id));
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('Error deleting location');
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Delivery Fees</h1>
                <p className="text-muted-foreground">Manage delivery locations and charges</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Add New */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location Name</label>
                                <Input 
                                    placeholder="e.g. Chandigarh University" 
                                    value={newName} 
                                    onChange={(e) => setNewName(e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Delivery Fee (₹)</label>
                                <Input 
                                    type="number"
                                    placeholder="0" 
                                    value={newFee} 
                                    onChange={(e) => setNewFee(e.target.value)} 
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={adding}>
                                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Location'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Locations ({locations.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {locations.map((loc) => (
                                <div key={loc._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="font-medium">{loc.name}</p>
                                            <p className="text-sm text-muted-foreground">Fee: ₹{loc.fee}</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(loc._id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {locations.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No locations added yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

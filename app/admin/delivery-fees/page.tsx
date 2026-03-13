'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';

export default function DeliveryChargesPage() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Formula Fields
    const [isActive, setIsActive] = useState(true);
    const [baseFee, setBaseFee] = useState('');
    const [perKmCharge, setPerKmCharge] = useState('');
    const [highDemandSurcharge, setHighDemandSurcharge] = useState('');
    const [extraFee, setExtraFee] = useState('');
    const [extraFeeLabel, setExtraFeeLabel] = useState('');

    useEffect(() => {
        fetch('/api/admin/delivery-settings')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.settings) {
                    setIsActive(data.settings.isActive ?? true);
                    setBaseFee(data.settings.baseFee?.toString() || '');
                    setPerKmCharge(data.settings.perKmCharge?.toString() || '');
                    setHighDemandSurcharge(data.settings.highDemandSurcharge?.toString() || '');
                    setExtraFee(data.settings.extraFee?.toString() || '');
                    setExtraFeeLabel(data.settings.extraFeeLabel || '');
                }
            })
            .catch(() => toast.error('Failed to load settings'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            const payload: any = { isActive };
            if (baseFee) payload.baseFee = Number(baseFee);
            if (perKmCharge) payload.perKmCharge = Number(perKmCharge);
            if (highDemandSurcharge) payload.highDemandSurcharge = Number(highDemandSurcharge);
            if (extraFee) {
                payload.extraFee = Number(extraFee);
                payload.extraFeeLabel = extraFeeLabel || 'Extra Fee';
            }
            
            const res = await fetch('/api/admin/delivery-settings', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Delivery charges updated perfectly!');
            } else {
                toast.error(data.error || 'Failed to save settings');
            }
        } catch (error) {
            toast.error('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    // Live Preview Math
    const mockKm = 5;
    const previewMath: number = 
        (Number(baseFee) || 0) + 
        ((Number(perKmCharge) || 0) * mockKm) + 
        (Number(highDemandSurcharge) || 0) + 
        (Number(extraFee) || 0);

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

    const field = (
        value: string, 
        setValue: (v: string) => void, 
        label: string, 
        hint: string,
        placeholder: string = "0"
    ) => (
        <div className="space-y-1.5 p-4 border rounded-lg bg-gray-50/50">
            <Label className="text-base font-semibold text-gray-900">{label}</Label>
            <p className="text-sm text-gray-500 pb-2">{hint}</p>
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                <Input 
                    type="number" 
                    placeholder={placeholder} 
                    value={value} 
                    onChange={e => setValue(e.target.value)}
                    className="pl-8"
                />
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Delivery Charges</h1>
                <p className="text-muted-foreground mt-2">
                    Build your custom delivery fee formula. Leave a field completely empty if you do not want to charge for it.
                </p>
            </div>

            <div className="grid xl:grid-cols-3 gap-8 items-start">
                <Card className="xl:col-span-2 shadow-sm border-gray-200">
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex items-center gap-4 justify-between">
                            <div>
                                <CardTitle className="text-xl">Charge Calculator Setup</CardTitle>
                                <CardDescription className="text-sm mt-1">
                                    Base Fee + (Per Km × Store Distance) + High Demand + Extra
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="active-toggle" className="font-medium cursor-pointer">Active</Label>
                                <Switch 
                                    id="active-toggle" 
                                    checked={isActive} 
                                    onCheckedChange={setIsActive} 
                                />
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                        <form id="delivery-settings-form" onSubmit={handleSave} className="grid md:grid-cols-2 gap-6">
                            {field(baseFee, setBaseFee, 'Base Delivery Fee', 'A flat fee charged on every single order.', 'e.g. 30')}
                            {field(perKmCharge, setPerKmCharge, 'Per Km Charge', 'Multiplied by the distance between the store and customer.', 'e.g. 5')}
                            {field(highDemandSurcharge, setHighDemandSurcharge, 'High Demand Surcharge', 'A flat premium fee applied during busy hours.', 'e.g. 20')}
                            {field(extraFee, setExtraFee, 'Extra Misc Fee', 'Any other flat charge you wish to add.', 'e.g. 10')}
                            
                            {/* Extra fee label input */}
                            <div className="md:col-span-2 space-y-2 p-4 border rounded-lg bg-gray-50/50">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold">Extra Fee Name (Optional)</Label>
                                </div>
                                <p className="text-sm text-gray-500">What should the "Extra Misc Fee" be called to the user? (e.g. "Handling Fee")</p>
                                <Input 
                                    placeholder="Extra Fee" 
                                    value={extraFeeLabel} 
                                    onChange={e => setExtraFeeLabel(e.target.value)}
                                    maxLength={30}
                                />
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Right side Live Preview */}
                <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-white to-gray-50 top-6 sticky">
                    <CardHeader className="bg-primary/5 border-b pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg text-primary">
                            <Calculator className="h-5 w-5" />
                            Live Preview
                        </CardTitle>
                        <CardDescription>
                            How this looks to a user <strong>5 kilometers</strong> away from the store.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!isActive && (
                            <div className="bg-orange-50 text-orange-600 p-3 rounded-md text-sm mb-4 border border-orange-200 font-medium">
                                Delivery charges are currently disabled. User fees will be zero.
                            </div>
                        )}
                        
                        <div className={`space-y-3 ${!isActive ? 'opacity-40 grayscale' : ''}`}>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Base Fee</span>
                                <span className="font-semibold">{baseFee ? `₹${baseFee}` : '—'}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Distance (5km)</span>
                                <span className="font-semibold text-blue-600">
                                    {perKmCharge ? `+ ₹${Number(perKmCharge) * 5}` : '—'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">High Demand</span>
                                <span className="font-semibold text-orange-500">
                                    {highDemandSurcharge ? `+ ₹${highDemandSurcharge}` : '—'}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 truncate max-w-[140px]">{extraFeeLabel || 'Extra Fee'}</span>
                                <span className="font-semibold">
                                    {extraFee ? `+ ₹${extraFee}` : '—'}
                                </span>
                            </div>
                            
                            <div className="border-t pt-3 mt-4 flex justify-between items-center text-lg bg-gray-100 p-2 rounded">
                                <span className="font-bold text-gray-900">Total Charge</span>
                                <span className="font-bold text-green-600 text-xl">₹{previewMath}</span>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            form="delivery-settings-form" 
                            className="w-full mt-6 shadow-md hover:shadow-lg transition-all"
                            size="lg"
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : null}
                            Save Formula Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

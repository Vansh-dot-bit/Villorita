'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function AdminAddonsPage() {
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { token, user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const res = await fetch('/api/addons');
      const data = await res.json();
      if (data.success) {
        setAddons(data.addons);
      }
    } catch (error) {
      toast.error('Failed to load addons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/addons/${editingId}` : '/api/addons';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
          isActive: formData.isActive
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? 'Addon updated' : 'Addon created');
        setFormData({ name: '', price: '', isActive: true });
        setEditingId(null);
        fetchAddons();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (addon: any) => {
    setEditingId(addon._id);
    setFormData({
      name: addon.name,
      price: addon.price.toString(),
      isActive: addon.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this addon?')) return;
    
    try {
      const res = await fetch(`/api/addons/${id}`, {
        method: 'DELETE',
        headers: {
           'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Addon deleted');
        fetchAddons();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Manage Add-ons</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Add-on' : 'Create Add-on'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Add-on Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sparklers, Balloons"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active Status</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update' : 'Create'}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', price: '', isActive: true });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>All Add-ons</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : addons.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-gray-50 border-dashed">
                <p className="text-muted-foreground">No add-ons found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {addons.map((addon) => (
                  <div key={addon._id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{addon.name}</span>
                        {!addon.isActive && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-pink-600">₹{addon.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(addon)}>
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(addon._id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

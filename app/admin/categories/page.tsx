'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ImageUploadInput } from '@/components/ui/image-upload';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';

interface StoreOption {
    _id: string;
    id: string;
    name: string;
    vendorId: { name?: string; email?: string } | string;
}

export default function CategoriesPage() {
    const { token } = useAuth();
    const [categories, setCategories] = useState<any[]>([]);
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories?all=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setCategories(data.categories);
            }
        } catch {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const fetchStores = async () => {
        try {
            const res = await fetch('/api/admin/stores', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStores(data.stores);
            }
        } catch {
            // fail silently
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) {
            toast.error('Category name is required');
            return;
        }

        setAdding(true);
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newCategory.trim(),
                    color: 'bg-purple-100',
                    image: newCategoryImage,
                    storeId: selectedStoreId || undefined,
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Category added successfully!');
                setNewCategory('');
                setNewCategoryImage('');
                setSelectedStoreId('');
                setCategories(prev => [data.category, ...prev]);
            } else {
                toast.error(data.error || 'Failed to add category');
            }
        } catch {
            toast.error('Something went wrong');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will not delete products in this category.')) return;

        try {
            const res = await fetch(`/api/categories?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Category deleted');
                setCategories(prev => prev.filter(c => c.id !== id));
            } else {
                toast.error('Failed to delete');
            }
        } catch {
            toast.error('Error deleting category');
        }
    };

    const getStoreName = (storeId: string | undefined) => {
        if (!storeId) return null;
        const store = stores.find(s => s._id === storeId || s.id === storeId);
        return store?.name || 'Unknown Store';
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                <p className="text-muted-foreground">Manage product categories and link them to stores/vendors</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Add New */}
                <Card>
                    <CardHeader>
                        <CardTitle>Add Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="flex flex-col gap-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Category Name *</label>
                                <Input
                                    placeholder="e.g. Birthday Cakes"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                            </div>

                            {/* Store Selector */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Link to Store / Vendor
                                    <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                                </label>
                                <select
                                    value={selectedStoreId}
                                    onChange={(e) => setSelectedStoreId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">— No specific store (global) —</option>
                                    {stores.map((store) => {
                                        const vendor = typeof store.vendorId === 'object' ? store.vendorId : null;
                                        return (
                                            <option key={store._id || store.id} value={store._id || store.id}>
                                                {store.name}{vendor?.name ? ` (${vendor.name})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                {selectedStoreId && (
                                    <p className="mt-1 text-xs text-blue-600">
                                        Orders from this category will be routed to this store after admin verification.
                                    </p>
                                )}
                            </div>

                            {/* Image */}
                            <ImageUploadInput
                                name="image"
                                label="Category Image"
                                defaultValue={newCategoryImage}
                                onChange={(path) => setNewCategoryImage(path)}
                            />

                            <Button type="submit" disabled={adding} className="w-full mt-2">
                                {adding
                                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
                                    : <><Plus className="h-4 w-4 mr-2" /> Add Category</>
                                }
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Categories ({categories.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {categories.map((cat) => {
                                const storeName = getStoreName(cat.storeId);
                                return (
                                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border shrink-0">
                                                {cat.image ? (
                                                    <img
                                                        src={cat.image.startsWith('http') ? cat.image : `/api/uploads/${cat.image}`}
                                                        alt={cat.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-400">{cat.name[0]}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-medium block truncate">{cat.name}</span>
                                                {storeName && (
                                                    <span className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                                                        <Store className="h-3 w-3" />
                                                        {storeName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-2 shrink-0">
                                            {storeName ? (
                                                <Badge variant="secondary" className="text-xs hidden sm:flex">Linked</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs hidden sm:flex">Global</Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(cat.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {categories.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No categories found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

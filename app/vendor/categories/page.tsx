'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ImageUploadInput } from '@/components/ui/image-upload';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function VendorCategoriesPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>([]);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const fetchStoreAndCategories = async () => {
            const authToken = token || localStorage.getItem('token');
            if (!authToken) {
                setLoading(false);
                router.push('/login');
                return;
            }

            try {
                // Fetch Store
                const storeRes = await fetch('/api/vendor/store', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const storeData = await storeRes.json();
                
                if (storeData.success && storeData.store) {
                    setStoreId(storeData.store._id);
                    
                    // Fetch vendor's categories
                    const catRes = await fetch('/api/vendor/categories', {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    const catData = await catRes.json();
                    if (catData.success) {
                        setCategories(catData.categories);
                    } else {
                        toast.error(catData.error || "Failed to load categories");
                    }
                } else {
                    toast.error("You need a store assigned by admin.");
                }
            } catch (error) {
                toast.error('Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        if (user && (user.role === 'vendor' || user.role === 'admin')) {
            fetchStoreAndCategories();
        }
    }, [user, token, router]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        setAdding(true);
        const authToken = token || localStorage.getItem('token');
        try {
            const res = await fetch('/api/vendor/categories', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}` 
                },
                body: JSON.stringify({ name: newCategory, color: 'bg-purple-100', image: newCategoryImage }) 
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success('Category added');
                setNewCategory('');
                setNewCategoryImage('');
                setCategories([...categories, data.category]);
            } else {
                toast.error(data.error || 'Failed to add category');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will not delete products in this category.')) return;

        const authToken = token || localStorage.getItem('token');
        try {
            const res = await fetch(`/api/vendor/categories?id=${id}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Category deleted');
                setCategories(categories.filter(c => c.id !== id));
            } else {
                toast.error(data.error || 'Failed to delete');
            }
        } catch (error) {
            toast.error('Error deleting category');
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;
    if (!storeId) return <div className="p-8 text-red-500 text-center">Store required to manage categories.</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-purple-900">Categories</h1>
                <p className="text-muted-foreground">Manage your store's categories</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Add New */}
                <Card>
                    <CardHeader>
                        <CardTitle>Create Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Category Name *</label>
                                <Input 
                                    placeholder="e.g. Birthday Cakes" 
                                    value={newCategory} 
                                    onChange={(e) => setNewCategory(e.target.value)} 
                                />
                            </div>
                            <ImageUploadInput
                                name="image"
                                label="Category Image"
                                defaultValue={newCategoryImage}
                                onChange={(path) => setNewCategoryImage(path)}
                            />
                            <Button type="submit" disabled={adding} className="w-full bg-purple-600 hover:bg-purple-700">
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
                        <CardTitle>Your Categories ({categories.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-purple-50 overflow-hidden flex items-center justify-center border border-purple-100">
                                            {cat.image ? (
                                                <img 
                                                    src={cat.image.startsWith('http') ? cat.image : `/api/uploads/${cat.image}`} 
                                                    alt={cat.name} 
                                                    className="h-full w-full object-cover" 
                                                />
                                            ) : (
                                                <Tag className="h-4 w-4 text-purple-400" />
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-800">{cat.name}</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(cat.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 bg-gray-50 rounded-lg border border-dashed">No categories found.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

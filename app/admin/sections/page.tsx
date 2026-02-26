'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';

export default function SectionsPage() {
    const { token } = useAuth();
    const [sections, setSections] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState('grid');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [sectionsRes, productsRes] = await Promise.all([
                fetch('/api/sections'),
                fetch('/api/products')
            ]);
            
            const sectionsData = await sectionsRes.json();
            const productsData = await productsRes.json();

            if (sectionsData.success) setSections(sectionsData.sections);
            if (productsData.products) setProducts(productsData.products);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/sections', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    title, 
                    type, 
                    products: selectedProducts,
                    order: sections.length 
                })
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success('Section created');
                setTitle('');
                setSelectedProducts([]);
                setIsCreating(false);
                fetchData(); // Refresh to get populated data
            } else {
                toast.error(data.error || 'Failed to create section');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this section?')) return;

        try {
            const res = await fetch(`/api/sections?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Section deleted');
                setSections(sections.filter(s => s.id !== id));
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('Error deleting section');
        }
    };

    const toggleProduct = (productId: string) => {
        if (selectedProducts.includes(productId)) {
            setSelectedProducts(selectedProducts.filter(id => id !== productId));
        } else {
            setSelectedProducts([...selectedProducts, productId]);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Homepage Sections</h1>
                    <p className="text-muted-foreground">Manage dynamic product sections on the homepage</p>
                </div>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> New Section</>}
                </Button>
            </div>

            {isCreating && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Create New Section</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Section Title</label>
                                    <Input 
                                        placeholder="e.g. Summer Special" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Display Type</label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="grid">Grid (Standard)</SelectItem>
                                            <SelectItem value="carousel">Carousel (Sliding)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Products ({selectedProducts.length})</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-white">
                                    {products.map(product => (
                                        <div 
                                            key={product._id} 
                                            className={`p-2 text-sm border rounded cursor-pointer transition-colors flex justify-between items-center ${selectedProducts.includes(product._id) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-gray-50'}`}
                                            onClick={() => toggleProduct(product._id)}
                                        >
                                            <div className="font-medium truncate">{product.name}</div>
                                            <div className={`text-xs ${selectedProducts.includes(product._id) ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>₹{product.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" disabled={submitting} className="w-full">
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Section'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {sections.map((section) => (
                    <Card key={section._id}>
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-lg font-bold">{section.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {section.products?.length || 0} products • {section.type} view
                                </p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(section._id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                
                {sections.length === 0 && !isCreating && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                        No sections found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}

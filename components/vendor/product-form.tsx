'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { IProduct as Product } from "@/models/Product"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImageUploadInput } from "@/components/ui/image-upload"

interface VendorProductFormProps {
  product?: Product
  storeId: string
}

export function VendorProductForm({ product, storeId }: VendorProductFormProps) {
  const isEditing = !!product
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [weights, setWeights] = useState<{weight: string, price: number}[]>(product?.weights || [])
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Fetch categories specific to this store AND global categories
    fetch(`/api/vendor/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()).then(data => {
        if(data.success && data.categories) {
            setCategories(data.categories);
        }
    });
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    let parsedWeights;
    if (data.weights) {
        try {
            parsedWeights = JSON.parse(data.weights as string);
        } catch (err) {}
    }
    
    const payload = {
        ...data,
        weights: parsedWeights,
        isCombo: data.isCombo === 'true'
    };

    const token = localStorage.getItem('token');
    if (!token) {
        toast.error("Not authenticated");
        setLoading(false);
        return;
    }

    try {
        const productId = (product as any)?._id || (product as any)?.id;
        const url = isEditing ? `/api/vendor/products/${productId}` : '/api/vendor/products';
        const method = isEditing ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (resData.success) {
            toast.success(isEditing ? "Updated successfully!" : "Created successfully!");
            router.push('/vendor/products');
            router.refresh();
        } else {
            toast.error(resData.error || "Something went wrong");
        }
    } catch (error) {
        toast.error("Failed to save product");
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-8 rounded-xl shadow-sm">
      <input type="hidden" name="storeId" value={storeId} />
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product/Combo Name</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        <input type="hidden" name="price" value="0" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={product?.category}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
                {categories.length === 0 && <SelectItem value="Uncategorized" disabled>No categories found</SelectItem>}
                {categories.map((cat) => (
                    <SelectItem key={cat.id || cat._id} value={cat.name}>{cat.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={product?.type || "Eggless"}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Eggless">Eggless</SelectItem>
              <SelectItem value="Contains Egg">Contains Egg</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <ImageUploadInput name="image" label="Product Image" defaultValue={product?.image} />
      </div>

      <div className="flex items-center space-x-2 bg-purple-50 p-4 rounded-lg border border-purple-100">
        <Switch id="isCombo" name="isCombo" defaultChecked={product?.isCombo || false} value="true" />
        <div className="space-y-1">
            <Label htmlFor="isCombo" className="text-purple-900 font-semibold">Is this a Combo?</Label>
            <p className="text-xs text-purple-700">Combos are groups of items sold together.</p>
        </div>
      </div>

      <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
            <div>
                <Label className="text-base font-semibold">Pricing & Variants</Label>
                <p className="text-sm text-muted-foreground">Add at least one option.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setWeights([...weights, { weight: '', price: 0 }])}>
                Add Variant
            </Button>
        </div>
        <div className="space-y-3">
            {weights.map((w, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                        <Label className="text-xs">Weight/Size</Label>
                        <Input 
                            placeholder="e.g. 1kg or Large" 
                            value={w.weight} 
                            onChange={(e) => {
                                const newWeights = [...weights];
                                newWeights[index].weight = e.target.value;
                                setWeights(newWeights);
                            }}
                        />
                    </div>
                    <div className="col-span-4">
                        <Label className="text-xs">Listing Price</Label>
                        <Input 
                            type="number" 
                            placeholder="0" 
                            value={isNaN(w.price) ? '' : w.price}
                            onChange={(e) => {
                                const newWeights = [...weights];
                                const val = parseFloat(e.target.value);
                                newWeights[index].price = isNaN(val) ? NaN : val;
                                setWeights(newWeights);
                            }}
                        />
                    </div>
                    <div className="col-span-1">
                        <Button type="button" variant="ghost" size="icon" className="mb-0.5" onClick={() => setWeights(weights.filter((_, i) => i !== index))}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            ))}
            {weights.length === 0 && (
                <p className="text-sm text-red-500 italic">Please add at least one variant.</p>
            )}
        </div>
        <input 
            type="hidden" 
            name="weights" 
            value={JSON.stringify(weights.map(w => ({ weight: w.weight, price: isNaN(w.price) ? 0 : w.price })))} 
            suppressHydrationWarning 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Items included)</Label>
        <Textarea id="description" name="description" defaultValue={product?.description} />
      </div>

      <div className="space-y-2 border p-4 rounded-lg bg-blue-50/50">
        <Label htmlFor="preparingTime" className="text-base font-semibold text-blue-900">Preparing Time (minutes)</Label>
        <p className="text-xs text-blue-700">How many minutes does this product take to prepare?</p>
        <Input
          id="preparingTime"
          name="preparingTime"
          type="number"
          min="0"
          step="5"
          className="max-w-xs"
          defaultValue={(product as any)?.preparingTime ?? 60}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" size="lg" disabled={loading}>
          {isEditing ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  )
}

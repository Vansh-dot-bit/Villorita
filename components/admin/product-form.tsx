'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IProduct as Product } from "@/models/Product"
import { createProductAction, updateProductAction } from "@/app/admin/products/actions"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ImageUploadInput } from "@/components/ui/image-upload"

interface ProductFormProps {
  product?: Product
}

export function ProductForm({ product }: ProductFormProps) {
  const isEditing = !!product
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [weights, setWeights] = useState<{weight: string, price: number}[]>(product?.weights || [])

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(data => {
        if(data.success) setCategories(data.categories);
    });
  }, []);

  // We need to wrap the action to handle loading state or use useActionState (experimental)
  // For simplicity, we'll just submit the form.
  
  return (
    <form action={isEditing ? updateProductAction.bind(null, (product as any).id) : createProductAction} className="space-y-6 max-w-2xl bg-white p-8 rounded-xl shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        {/* Price is handled in the Weights section below */}
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
                {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
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

      <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between">
            <div>
                <Label className="text-base font-semibold">Pricing & Variants</Label>
                <p className="text-sm text-muted-foreground">Add at least one weight option.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setWeights([...weights, { weight: '', price: 0 }])}>
                Add Variant
            </Button>
        </div>
        <div className="space-y-3">
            {weights.map((w, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                        <Label className="text-xs">Weight</Label>
                        <Input 
                            placeholder="e.g. 1kg" 
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
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={product?.description} />
      </div>

      <div className="space-y-2 border p-4 rounded-lg bg-blue-50/50">
        <Label htmlFor="preparingTime" className="text-base font-semibold text-blue-900">Preparing Time (minutes)</Label>
        <p className="text-xs text-blue-700">How many minutes does it take to prepare this product?</p>
        <Input
          id="preparingTime"
          name="preparingTime"
          type="number"
          min="0"
          step="5"
          className="max-w-xs"
          defaultValue={product?.preparingTime ?? 60}
        />
      </div>

      <div className="space-y-2 border p-4 rounded-lg bg-yellow-50/50">
        <Label htmlFor="rating" className="text-base font-semibold text-yellow-900">Manual Rating (0-5)</Label>
        <p className="text-xs text-yellow-700">Set a custom average rating for this product to display to users.</p>
        <Input
          id="rating"
          name="rating"
          type="number"
          min="0"
          max="5"
          step="0.1"
          className="max-w-xs"
          defaultValue={product?.rating?.average ?? 0}
        />
        {/* Pass down the existing count so it isn't erased on update */}
        <input type="hidden" name="ratingCount" value={product?.rating?.count ?? 0} />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" size="lg" disabled={loading}>
          {isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  )
}

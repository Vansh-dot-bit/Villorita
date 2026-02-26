'use client'

import React, { useState, useEffect } from "react"
import { VendorProductForm } from "@/components/vendor/product-form"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function EditVendorProductPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  
  const [storeId, setStoreId] = useState<string | null>(null)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { user, token } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    const fetchData = async () => {
      const authToken = token || localStorage.getItem('token')
      if (!authToken) {
          router.push('/login')
          return
      }

      try {
        // Fetch Store
        const storeRes = await fetch('/api/vendor/store', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        const storeData = await storeRes.json()
        if (storeData.success && storeData.store) {
          setStoreId(storeData.store._id)
          
          // Fetch all products for vendor and find this one
          // We do this instead of a dedicated endpoint for single product to save time,
          // or we can just fetch the global product.
          const prodRes = await fetch(`/api/products/${id}`);
          if (prodRes.ok) {
              const prodData = await prodRes.json();
              if (prodData.success) {
                  setProduct(prodData.product);
              } else {
                  setError(true);
              }
          } else {
              setError(true);
          }
        } else {
          toast.error("You need a store assigned by admin.")
          router.push('/vendor')
        }
      } catch (err) {
        toast.error("Failed to load data")
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (user && (user.role === 'vendor' || user.role === 'admin')) {
        fetchData()
    }
  }, [user, token, router, id])

  if (loading) return <div className="p-8">Loading...</div>
  if (error || !product) return <div className="p-8 text-red-500">Product not found.</div>
  if (!storeId) return <div className="p-8 text-red-500">Store required.</div>

  // Ensure vendors don't edit other vendors' products
  if (product.storeId && product.storeId !== storeId && product.storeId.toString() !== storeId) {
      return <div className="p-8 text-red-500">Not authorized to edit this product.</div>
  }

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-3xl font-bold tracking-tight text-purple-900">Edit Item</h1>
         <p className="text-muted-foreground">Update product or combo details</p>
      </div>
      <VendorProductForm storeId={storeId} product={product} />
    </div>
  )
}

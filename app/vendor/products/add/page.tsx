'use client'

import { useState, useEffect } from "react"
import { VendorProductForm } from "@/components/vendor/product-form"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function AddVendorProductPage() {
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchStore = async () => {
      const authToken = token || localStorage.getItem('token')
      if (!authToken) {
          router.push('/login')
          return
      }

      try {
        const res = await fetch('/api/vendor/store', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
        const data = await res.json()
        if (data.success && data.store) {
          setStoreId(data.store._id)
        } else {
          toast.error("You need a store assigned by admin.")
          router.push('/vendor')
        }
      } catch (err) {
        toast.error("Failed to load store")
      } finally {
        setLoading(false)
      }
    }

    if (user && (user.role === 'vendor' || user.role === 'admin')) {
        fetchStore()
    }
  }, [user, token, router])

  if (loading) return <div className="p-8">Loading...</div>
  if (!storeId) return <div className="p-8 text-red-500">Store required.</div>

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-3xl font-bold tracking-tight text-purple-900">Add Item</h1>
         <p className="text-muted-foreground">Add a new product or combo to your store</p>
      </div>
      <VendorProductForm storeId={storeId} />
    </div>
  )
}

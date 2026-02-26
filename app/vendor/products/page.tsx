'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/layout/header"

export default function VendorProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, token } = useAuth()
  const [store, setStore] = useState<any>(null)

  const fetchProducts = async () => {
    setLoading(true)
    const authToken = token || localStorage.getItem('token')

    if (!authToken) {
        setLoading(false)
        return
    }

    try {
      const res = await fetch('/api/vendor/products', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setProducts(data.products)
        setStore(data.store)
      } else {
        toast.error(data.error || data.message || "Failed to fetch products")
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && (user.role === 'vendor' || user.role === 'admin')) {
      fetchProducts()
    } else {
        setLoading(false)
    }
  }, [user, token])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const authToken = token || localStorage.getItem('token')
    try {
        const res = await fetch(`/api/vendor/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
        const data = await res.json()
        if (data.success) {
            toast.success("Item deleted successfully")
            fetchProducts()
        } else {
            toast.error(data.error || "Failed to delete item")
        }
    } catch (err) {
         toast.error("An error occurred")
    }
  }

  const toggleAvailability = async (id: string, currentStatus: boolean, index: number) => {
      const authToken = token || localStorage.getItem('token');
      // Optimistic update
      const newProducts = [...products];
      newProducts[index].isAvailable = !currentStatus;
      setProducts(newProducts);

      try {
          const res = await fetch(`/api/vendor/products/${id}`, {
              method: 'PUT',
              headers: { 
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ isAvailable: !currentStatus })
          });
          const data = await res.json();
          if (!data.success) {
              toast.error(data.error || "Failed to update availability");
              // Revert
              newProducts[index].isAvailable = currentStatus;
              setProducts([...newProducts]);
          }
      } catch (err) {
          toast.error("Failed to update availability");
          // Revert
          newProducts[index].isAvailable = currentStatus;
          setProducts([...newProducts]);
      }
  }

  if (loading) {
      return <div className="p-8">Loading products...</div>
  }

  if (!store) {
      return <div className="p-8 text-center text-red-500">You must be assigned to a Store by the admin first.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Products & Combos</h1>
           <p className="text-muted-foreground">Manage your store's catalog</p>
        </div>
        <Link href="/vendor/products/add">
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4" /> Add Item
            </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-4 border-b">
             <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search items..." className="pl-9" />
             </div>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Image</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Combo?</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Availability</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {products.length === 0 && (
                  <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No products found.</td></tr>
              )}
              {products.map((product, index) => (
                <tr key={product._id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                        <img 
                            src={product.image?.startsWith('http') ? product.image : `/api/uploads/${product.image}`} 
                            alt={product.name} 
                            className="h-full w-full object-cover" 
                        />
                    </div>
                  </td>
                  <td className="p-4 align-middle font-medium">{product.name}</td>
                  <td className="p-4 align-middle">{product.category}</td>
                  <td className="p-4 align-middle">₹{product.price}</td>
                  <td className="p-4 align-middle">
                    {product.isCombo ? <span className="text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full text-xs">Yes</span> : <span className="text-gray-500">No</span>}
                  </td>
                  <td className="p-4 align-middle">
                     <button
                        onClick={() => toggleAvailability(product._id, product.isAvailable, index)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${product.isAvailable ? 'bg-primary' : 'bg-input'}`}
                      >
                        <span className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${product.isAvailable ? 'translate-x-2' : '-translate-x-2'}`} />
                      </button>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                        <Link href={`/vendor/products/${product._id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(product._id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

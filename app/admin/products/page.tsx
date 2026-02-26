import Link from "next/link"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getProducts } from "@/lib/products"
import { deleteProductAction } from "@/app/admin/products/actions"
import { ProductAvailabilitySwitch } from "./product-availability-switch"

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Products</h1>
           <p className="text-muted-foreground">Manage your cake inventory</p>
        </div>
        <Link href="/admin/products/add">
            <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Product
            </Button>
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-4 border-b">
             <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-9" />
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
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rating</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Availability</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {products.map((product) => (
                <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                        <img 
                            src={product.image.startsWith('http') ? product.image : `/api/uploads/${product.image}`} 
                            alt={product.name} 
                            className="h-full w-full object-cover" 
                        />
                    </div>
                  </td>
                  <td className="p-4 align-middle font-medium">{product.name}</td>
                  <td className="p-4 align-middle">{product.category}</td>
                  <td className="p-4 align-middle">₹{product.price}</td>
                  <td className="p-4 align-middle font-semibold text-yellow-600">
                    {product.rating?.average || 0} ★
                  </td>
                  <td className="p-4 align-middle">
                    <ProductAvailabilitySwitch productId={product.id} isAvailable={product.isAvailable} />
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${product.type === 'Eggless' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.type}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>
                        <form action={deleteProductAction.bind(null, product.id)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </form>
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

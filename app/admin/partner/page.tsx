import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"
import Product from "@/models/Product"
import Image from "next/image"
import Link from "next/link"
import { Percent } from "lucide-react"

export const dynamic = 'force-dynamic'

async function getPartnerData() {
  await dbConnect()

  const stores = await Store.find({ isActive: true }).sort({ createdAt: -1 }).lean()
  const allProducts = await Product.find({ isActive: true }).lean()

  // Group products by storeId
  const storeData = stores.map((store: any) => {
    const storeProducts = allProducts.filter(
      (p: any) => p.storeId && p.storeId.toString() === store._id.toString()
    )
    return {
      ...store,
      _id: store._id.toString(),
      products: JSON.parse(JSON.stringify(storeProducts)),
    }
  })

  // Products not associated with any store
  const globalProducts = allProducts.filter((p: any) => !p.storeId)

  return { storeData, globalProducts: JSON.parse(JSON.stringify(globalProducts)) }
}

export default async function PartnerPage() {
  const { storeData, globalProducts } = await getPartnerData()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
        <p className="text-muted-foreground mt-1">View all partner stores, their products, and admin cut</p>
      </div>

      {/* Store sections */}
      {storeData.map((store: any) => (
        <Card key={store._id} className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {store.photo && (
                  <div className="h-14 w-14 rounded-xl overflow-hidden border shrink-0">
                    <img
                      src={store.photo.startsWith('http') ? store.photo : `/api/uploads/${store.photo}`}
                      alt={store.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl">{store.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{store.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold px-3 py-1.5 rounded-full">
                  <Percent className="h-4 w-4" />
                  Admin Cut: {store.adminCutPercentage ?? 0}%
                </div>
                <Link href={`/admin/stores/${store._id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">Edit Store</Badge>
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {store.products.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No products linked to this store yet.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Product</th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Category</th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Stock</th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground">Price</th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground">Admin Earns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.products.map((product: any) => {
                      const adminAmount = Math.round(product.price * (store.adminCutPercentage ?? 0) / 100)
                      const vendorAmount = product.price - adminAmount
                      return (
                        <tr key={product._id} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 relative overflow-hidden rounded-lg bg-muted shrink-0">
                                {product.image && (
                                  <Image
                                    src={product.image.startsWith('http') || product.image.startsWith('/') ? product.image : `/api/uploads/${product.image}`}
                                    alt={product.name} fill className="object-cover"
                                  />
                                )}
                              </div>
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="p-4 capitalize text-muted-foreground">{product.category}</td>
                          <td className="p-4">
                            <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>{product.stock} in stock</Badge>
                          </td>
                          <td className="p-4 text-right font-medium">₹{product.price}</td>
                          <td className="p-4 text-right">
                            <div className="font-bold text-indigo-700">₹{adminAmount}</div>
                            <div className="text-xs text-muted-foreground">Vendor: ₹{vendorAmount}</div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Global products (not store-linked) */}
      {globalProducts.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Direct Products (not store-linked)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Product</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Category</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Stock</th>
                    <th className="h-10 px-4 text-right font-medium text-muted-foreground">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {globalProducts.map((product: any) => (
                    <tr key={product._id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 relative overflow-hidden rounded-lg bg-muted shrink-0">
                            {product.image && (
                              <Image
                                src={product.image.startsWith('http') || product.image.startsWith('/') ? product.image : `/api/uploads/${product.image}`}
                                alt={product.name} fill className="object-cover"
                              />
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 capitalize text-muted-foreground">{product.category}</td>
                      <td className="p-4">
                        <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>{product.stock} in stock</Badge>
                      </td>
                      <td className="p-4 text-right font-medium">₹{product.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {storeData.length === 0 && globalProducts.length === 0 && (
        <p className="text-muted-foreground text-center py-20">No stores or products found.</p>
      )}
    </div>
  )
}

import { ProductForm } from "@/components/admin/product-form"
import { getProductById } from "@/lib/products"
import { notFound } from "next/navigation"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
         <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
         <p className="text-muted-foreground">Update {product.name}</p>
      </div>
      <ProductForm product={product} />
    </div>
  )
}

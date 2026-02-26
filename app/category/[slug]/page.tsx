import { notFound } from "next/navigation"
import { Star, ShoppingBag, Filter } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCard } from "@/components/product/product-card"
import { getProducts } from "@/lib/products"
import { getCategories } from "@/lib/categories"

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Fetch data
  const allCategories = await getCategories();
  const category = allCategories.find(c => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase());
  
  if (!category) {
      // Fallback for purely tag-based categories or 404
      // For now, let's treat it as a tag match if no category found, or just show Title
  }

  const title = category?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
  const image = category?.image;

  const allProducts = await getProducts();
  const products = allProducts.filter(p => 
      p.category.toLowerCase() === slug.toLowerCase() || 
      (category && p.category.toLowerCase() === category.name.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Category Banner */}
      <div className="container mx-auto px-4 mt-4">
        <div className="relative w-full rounded-[2rem] overflow-hidden bg-[#d9d9d9] shadow-sm border border-gray-200">
          
          <div className="relative z-10 py-10 px-6 sm:py-12 sm:px-8 text-center flex flex-col items-center justify-center min-h-[160px]">
              <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-sm">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground font-medium max-w-sm drop-shadow-sm">Premium, fresh, and delicious {title} flavors.</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        
        {/* Filters & Count */}
        <div className="mb-8 flex items-center justify-between">
            <span className="text-muted-foreground">{products.length} Products Found</span>
            <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Filter
            </Button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 px-1">
          {products.map((product) => (
             // @ts-ignore
             <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  )
}

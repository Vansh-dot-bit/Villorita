import Link from "next/link"
import { Clock, Star, Award, Sparkles, ChevronRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { ProductCard } from "@/components/product/product-card"
import { OfferCarousel } from "@/components/home/offer-carousel"
import { getProducts } from "@/lib/products"
import { getCategories } from "@/lib/categories"
import { getSections } from "@/lib/sections"
import { getListedStores } from "@/lib/stores"
import { StoreCard } from "@/components/store/store-card"

export default async function Home() {
  const products = await getProducts();
  const categories = await getCategories();
  const sections = await getSections();
  const stores = await getListedStores();

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="bg-[#d9d9d9] rounded-b-[40px] pb-8 mb-8 pt-2">
        <Header className="bg-transparent border-none shadow-none" />
        
        <main className="container mx-auto px-4 pt-4 space-y-8">
            {/* Categories Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-bold tracking-tight uppercase">SPECIAL For U!!</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                    {categories.map((cat, i) => (
                        <Link 
                          key={cat.id} 
                          href={cat.name === "Custom" ? "/custom-order" : `/category/${cat.slug || cat.name.toLowerCase()}`} 
                          className="group relative flex flex-col items-center gap-2 min-w-[80px]"
                        >
                             <div className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full ${cat.color || 'bg-white'} overflow-hidden shadow-sm group-hover:shadow-md transition-all flex items-center justify-center shrink-0`}>
                                {cat.image ? (
                                    <img 
                                        src={cat.image.startsWith('http') ? cat.image : `/api/uploads/${cat.image}`} 
                                        alt={cat.name} 
                                        className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                                    />
                                ) : (
                                    <span className="text-xl font-bold text-gray-400">{cat.name[0]}</span>
                                )}
                             </div>
                             <span className="font-bold text-xs sm:text-sm text-center text-gray-700 group-hover:text-primary transition-colors">{cat.name}</span>
                             {cat.name === "Custom" && (
                               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full shadow-sm animate-pulse">New!</span>
                             )}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Offers Section */}
            <section className="space-y-4">
                <div className="rounded-3xl shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                    <OfferCarousel />
                </div>
            </section>
        </main>
      </div>

      <main className="container mx-auto px-4 space-y-12 pb-12">
        {/* Featured Stores Section */}
        {stores.length > 0 && (
            <section className="space-y-6 pt-2">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Our Partners</h2>
                        <p className="text-sm text-muted-foreground mt-1">Discover popular stores near you</p>
                    </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-2">
                    {stores.map((store: any) => (
                        <StoreCard key={store.id} store={store} />
                    ))}
                </div>
            </section>
        )}

        {/* Dynamic Product Sections */}
        {sections.map((section) => (
          <section key={section.id} className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 px-2">
              {section.products.map((product: any) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
    
  )
}


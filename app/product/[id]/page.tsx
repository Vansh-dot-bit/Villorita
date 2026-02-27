import Image from "next/image"
import { notFound } from "next/navigation"
import { Star, Clock, ShieldCheck } from "lucide-react"
import { Header } from "@/components/layout/header"
import { ProductActions } from "@/components/product/product-actions"
import { getProductById } from "@/lib/products"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const product = await getProductById(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-secondary/30">
        <Header />
        
        <main className="container mx-auto px-4 py-6 md:py-8">
            <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
                
                {/* Left: Mobile-optimized Image */}
                <div className="flex justify-center">
                    <div className="w-full max-w-[320px] sm:max-w-[400px] lg:max-w-full aspect-square relative overflow-hidden rounded-[2rem] bg-white shadow-sm border border-gray-100">
                        {product.image ? (
                            <img 
                                src={product.image.startsWith('http') ? product.image : `/api/uploads/${product.image}`} 
                                alt={product.name} 
                                className="h-full w-full object-cover" 
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/10 text-4xl sm:text-6xl font-black uppercase">
                                {product.name.split(' ')[0]}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Details */}
                <div className="flex flex-col gap-6 md:gap-8">
                     
                     {/* Title & Ratings Block */}
                     <div className="space-y-4 rounded-3xl bg-white p-5 md:p-6 shadow-sm border border-gray-50">
                        <div className="flex flex-col gap-2"> 
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">{product.name}</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${product.type === 'Eggless' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {product.type === 'Eggless' ? '🟢 EGGLESS' : '🔴 CONTAINS EGG'}
                                </span>
                                <div className="flex items-center gap-1 text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                                    {typeof product.rating === 'object' ? product.rating.average : product.rating || 0} <Star className="h-3.5 w-3.5 fill-current" />
                                </div>
                            </div>
                        </div>
                     </div>

                     <div className="space-y-4 rounded-3xl bg-white p-5 md:p-6 shadow-sm border border-gray-50">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Description</h2>
                        <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                            {product.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4">
                             <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-2.5 md:p-3">
                                <Clock className="h-5 w-5 text-primary shrink-0" />
                                <div className="text-xs md:text-sm">
                                    <p className="font-bold text-gray-900">30 Mins</p>
                                    <p className="text-gray-500">Delivery</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-2.5 md:p-3">
                                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                                <div className="text-xs md:text-sm">
                                    <p className="font-bold text-gray-900">100% Safe</p>
                                    <p className="text-gray-500">Certified</p>
                                </div>
                             </div>
                        </div>
                     </div>

                     <div className="rounded-3xl bg-white p-5 md:p-6 shadow-sm border border-gray-50">
                        <div className="mb-5 flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
                            <span className="text-lg text-gray-400 line-through mb-0.5">₹{product.price + 200}</span>
                            <span className="mb-1.5 ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">20% OFF</span>
                        </div>
                        
                        {/* @ts-ignore */}
                        <ProductActions price={product.price} product={product} />
                     </div>

                </div>
            </div>
        </main>
    </div>
  )
}

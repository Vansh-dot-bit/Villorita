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
        
        {/* Cake Title Banner */}
        <div className="w-full bg-white py-8 shadow-sm">
            <div className="container mx-auto px-4">
               <div className="flex flex-col gap-1"> 
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{product.name}</h1>
                    <div className="flex items-center gap-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.type === 'Eggless' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {product.type === 'Eggless' ? '🟢 EGGLESS' : '🔴 CONTAINS EGG'}
                        </span>
                        <div className="flex items-center gap-1 text-sm font-bold text-yellow-600">
                            {typeof product.rating === 'object' ? product.rating.average : product.rating || 0} <Star className="h-4 w-4 fill-current" />
                            <span className="text-muted-foreground font-normal">(120 Reviews)</span>
                        </div>
                    </div>
               </div>
            </div>
        </div>

        <main className="container mx-auto px-4 py-8">
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Left: Big Image */}
                <div className="aspect-square relative overflow-hidden rounded-3xl bg-white shadow-sm">
                    {product.image ? (
                        <img 
                            src={product.image.startsWith('http') ? product.image : `/api/uploads/${product.image}`} 
                            alt={product.name} 
                            className="h-full w-full object-cover" 
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/10 text-6xl font-black uppercase">
                            {product.name.split(' ')[0]}
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="flex flex-col gap-8">
                     
                     <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold">Description</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {product.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                             <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                                <Clock className="h-5 w-5 text-primary" />
                                <div className="text-sm">
                                    <p className="font-bold">30 Mins</p>
                                    <p className="text-muted-foreground">Delivery</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <div className="text-sm">
                                    <p className="font-bold">100% Safe</p>
                                    <p className="text-muted-foreground">Certified</p>
                                </div>
                             </div>
                        </div>
                     </div>

                     <div className="rounded-3xl bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-end gap-2">
                            <span className="text-3xl font-bold">₹{product.price}</span>
                            <span className="text-lg text-muted-foreground line-through">₹{product.price + 200}</span>
                            <span className="mb-1 ml-auto text-sm font-bold text-green-600">20% OFF</span>
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

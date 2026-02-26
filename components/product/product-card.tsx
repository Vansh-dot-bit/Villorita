"use client"

import Link from "next/link"
import { Star, ShoppingBag, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "@/context/cart-context"
import { MouseEvent } from "react"
import { IProduct as Product } from "@/models/Product"

export function ProductCard({ product }: { product: Product & { id?: string, _id?: string } }) {
  const { addToCart } = useCart()

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault() // Prevent navigation if clicking the button
    e.stopPropagation()
    
    addToCart({
      id: String(product.id),
      name: product.name,
      price: product.price,
      weight: "0.5kg", // Default weight - ideally fetch from product.weights[0] if exists
      quantity: 1,
      image: product.image,
      type: product.type === "Eggless" ? "Eggless" : "Contains Egg", // Normalize or use as-is
      selectedPrice: product.price // Default price
    })
  }

  return (
    <Link href={`/product/${product.id}`} className="block h-full">
        <Card className="rounded-3xl group h-full overflow-hidden border-none shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer">
            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {product.image ? (
                     <img 
                        src={product.image.startsWith('http') ? product.image : `/api/uploads/${product.image}`} 
                        alt={product.name} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                     />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 text-4xl font-bold uppercase tracking-widest">
                        {product.name.split(' ')[0]}
                    </div>
                )}
            </div>
            <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between min-h-[3rem]">
                    <div>
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                        {product.description && <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-700 shrink-0">
                        {typeof product.rating === 'object' ? product.rating.average : product.rating || 0} <Star className="h-3 w-3 fill-current" />
                    </div>
                </div>
                
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${product.type === 'Eggless' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                        {product.type === 'Eggless' ? '🟢 EGGLESS' : '🔴 CONTAINS EGG'}
                    </span>
                    {(product as any).preparingTime > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {(product as any).preparingTime} min prep
                        </span>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="text-xl font-bold">₹{product.price}</span>
                    {product.isAvailable === false ? (
                        <Button disabled size="sm" className="rounded-xl px-4 z-10 bg-gray-400">
                            Unavailable
                        </Button>
                    ) : (
                        <Button size="sm" className="rounded-xl px-4 z-10 hover:scale-105 transition-transform" onClick={handleAddToCart}>
                            Add <ShoppingBag className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    </Link>
  )
}

"use client"

import Link from "next/link"
import { Star, ShoppingBag, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { MouseEvent } from "react"
import { IProduct as Product } from "@/models/Product"

export function ProductCard({ product }: { product: Product & { id?: string, _id?: string } }) {
  const { addToCart } = useCart()

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart({
      id: String(product.id),
      name: product.name,
      price: product.price,
      weight: "0.5kg",
      quantity: 1,
      image: product.image,
      type: product.type === "Eggless" ? "Eggless" : "Contains Egg",
      selectedPrice: product.price
    })
  }

  const isEggless = product.type === "Eggless"

  return (
    <Link href={`/product/${product.id || product._id}`} className="block h-full">
      {/* Perfect square card */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white group cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col">

        {/* Image — Flex 1 to take remaining space */}
        <div className="relative flex-1 w-full bg-muted overflow-hidden">
          {product.image ? (
            <img
              src={product.image.startsWith('http') ? product.image : `/api/uploads/${product.image}`}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground/20 text-4xl font-bold uppercase tracking-widest">
              {product.name.split(' ')[0]}
            </div>
          )}
          
          {/* Rating badge on top-right of image */}
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-lg bg-green-500/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
            {typeof product.rating === 'object' ? product.rating.average : product.rating || 0}
            <Star className="h-2.5 w-2.5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Info strip — auto height, shrink-0 */}
        <div className="bg-white px-2.5 pt-2 pb-2.5 flex flex-col gap-1.5 shrink-0 z-10">

          {/* Row 1: Name (left) */}
          <p className="font-bold text-[11px] sm:text-xs leading-tight line-clamp-1 text-gray-900">
            {product.name}
          </p>

          {/* Row 2: Egg type (left) + prep time (right) */}
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isEggless ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
              {isEggless ? '🟢 Eggless' : '🔴 Egg'}
            </span>
            {(product as any).preparingTime > 0 && (
              <span className="text-[9px] sm:text-[10px] font-medium text-blue-600 flex items-center gap-0.5">
                <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                {(product as any).preparingTime}m
              </span>
            )}
          </div>

          {/* Row 3: Price (left) + Add button (right) */}
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-sm font-extrabold text-gray-900">₹{product.price}</span>
            {product.isAvailable === false ? (
              <span className="text-[9px] text-gray-400 font-semibold px-2">Unavailable</span>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-0.5 bg-primary text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full hover:bg-primary/90 transition-colors"
                title="Add to cart"
              >
                Add <ShoppingBag className="h-2.5 w-2.5 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

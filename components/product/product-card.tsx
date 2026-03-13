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
      selectedPrice: product.price,
      storeId: product.storeId ? String(product.storeId) : undefined
    })
  }

  const isEggless = product.type === "Eggless"

  return (
    <Link href={`/product/${product.id || product._id}`} className="flex flex-col gap-1.5 h-full group">
      {/* The Card (Image + Rating + Egg indicator) */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-muted cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md">
        {/* Image */}
        {product.image ? (
          <img
            src={product.image.startsWith('http') ? product.image : `/api/uploads/${product.image}`}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/20 text-xl md:text-2xl font-bold uppercase tracking-widest">
            {product.name.substring(0, 2)}
          </div>
        )}
        
        {/* Rating badge */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-md bg-green-500/90 backdrop-blur-sm px-1 py-0.5 text-[9px] font-bold text-white shadow">
          {typeof product.rating === 'object' ? product.rating.average : product.rating || 0}
          <Star className="h-2 w-2 fill-current ml-[1px]" />
        </div>

        {/* Indicators at bottom */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
          <div 
            className={`h-2.5 w-2.5 rounded-full shadow-sm border border-white ${isEggless ? 'bg-green-500' : 'bg-red-500'}`} 
            title={isEggless ? 'Eggless' : 'Contains Egg'}
          />
        </div>
      </div>

      {/* Outside info: Name, Price, and Add Button */}
      <div className="flex flex-col gap-0.5 px-0.5 flex-1 justify-between">
        <p className="font-semibold text-[10px] sm:text-xs leading-tight line-clamp-2 text-gray-800">
          {product.name}
        </p>

        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-extrabold text-gray-900">₹{product.price}</span>
            {product.cuttedPrice && product.cuttedPrice > product.price && (
              <div className="flex items-center gap-1">
                <span className="text-[8px] sm:text-[10px] text-gray-400 line-through">₹{product.cuttedPrice}</span>
                <span className="text-[8px] sm:text-[10px] text-green-600 font-bold uppercase tracking-tighter">
                  {Math.round(((product.cuttedPrice - product.price) / product.cuttedPrice) * 100)}% OFF
                </span>
              </div>
            )}
          </div>
          {product.isAvailable === false ? (
            <span className="text-[9px] text-red-500 font-semibold">Unavailable</span>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-sm shrink-0"
              title="Add to cart"
            >
              <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

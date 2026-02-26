"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingBag, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"

export function ProductActions({ price, product }: { price: number, product: any }) {
  // Use weights from product if available, otherwise fallback to default logic (though new system enforces weights)
  const productWeights = product.weights && product.weights.length > 0 
      ? product.weights 
      : [{ weight: "0.5kg", price: price }]; 

  const [selectedWeight, setSelectedWeight] = useState(productWeights[0]);
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const router = useRouter()

  // Dynamic price based on selected weight
  const finalPrice = selectedWeight.price;

  const handleAddToCart = () => {
    addToCart({
        id: product.id || product._id, 
        name: product.name,
        price: finalPrice,
        weight: selectedWeight.weight,
        quantity,
        image: product.image,
        type: product.type,
        selectedPrice: finalPrice
    })
    // Simple feedback
    alert("Added to cart!")
  }

  const handleBuyNow = () => {
    handleAddToCart()
    router.push('/cart')
  }

  return (
    <div className="space-y-6">
      {/* Weight Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-muted-foreground">Select Weight</label>
        <div className="flex gap-3 flex-wrap">
          {productWeights.map((w: any) => (
            <button
              key={w.weight}
              onClick={() => setSelectedWeight(w)}
              className={`rounded-2xl border px-6 py-2 text-sm font-medium transition-all ${
                selectedWeight.weight === w.weight
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {w.weight}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 rounded-2xl border bg-white p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span className="font-medium text-foreground">Total:</span> 
             <span className="text-xl font-bold text-primary">₹{finalPrice * quantity}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        {product.isAvailable === false ? (
             <Button disabled className="flex-1 rounded-2xl py-6 text-base bg-gray-400" size="lg">
                Unavailable
             </Button>
        ) : (
            <>
                <Button onClick={handleAddToCart} className="flex-1 rounded-2xl py-6 text-base" size="lg">
                  Add to Cart <ShoppingBag className="ml-2 h-5 w-5" />
                </Button>
                <Button onClick={handleBuyNow} variant="secondary" className="flex-1 rounded-2xl py-6 text-base" size="lg">
                  Buy Now
                </Button>
            </>
        )}
        <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl">
            <Heart className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2 pt-4 justify-center sm:justify-start">
         <Button variant="link" className="text-muted-foreground h-auto p-0">
            <Share2 className="mr-2 h-4 w-4" /> Share this cake
         </Button>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Heart, Share2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/cart-context'
import { useRouter } from 'next/navigation'

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

function formatTime(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return h12 + ':' + pad2(m) + ' ' + ampm
}

// Last slot ends at 22:30 (10:30 PM). So last slot start = 22:00 (1320 mins).
const LAST_SLOT_START_MINS = 22 * 60 // 10:00 PM -> 10:30 PM is last slot

function generateScheduleSlots(deliveryTimeMins: number, makingTimeMins: number): string[] {
  const totalOffsetMins = (deliveryTimeMins || 0) + (makingTimeMins || 0)
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes() + totalOffsetMins
  const startSlot = Math.ceil(nowMins / 30) * 30

  const slots: string[] = []
  let slotStart = startSlot
  while (slotStart <= LAST_SLOT_START_MINS) {
    const slotEnd = slotStart + 30
    slots.push(formatTime(slotStart) + ' - ' + formatTime(slotEnd))
    slotStart += 30
  }
  return slots
}

export function ProductActions({ price, product }: { price: number, product: any }) {
  const productWeights: { weight: string; price: number; cuttedPrice?: number }[] =
    product.weights && product.weights.length > 0
      ? product.weights
      : [{ weight: '0.5kg', price: price, cuttedPrice: product.cuttedPrice }]

  const [selectedWeight, setSelectedWeight] = useState(productWeights[0])
  const [quantity, setQuantity] = useState(1)
  const [scheduledTime, setScheduledTime] = useState('No Schedule')
  const { addToCart } = useCart()
  const router = useRouter()

  const deliveryTimeMins = Number((product as any).store?.deliveryTime) || 45
  const makingTimeMins = Number((product as any).preparingTime) || 60
  const scheduleSlots = generateScheduleSlots(deliveryTimeMins, makingTimeMins)
  const finalPrice = selectedWeight.price

  const saveScheduleToStorage = (slot: string) => {
    if (slot === 'No Schedule') {
      localStorage.removeItem('scheduledTime')
    } else {
      localStorage.setItem('scheduledTime', slot)
    }
  }

  const handleAddToCart = () => {
    saveScheduleToStorage(scheduledTime)
    addToCart({
      id: product.id || product._id,
      name: product.name,
      price: finalPrice,
      weight: selectedWeight.weight,
      quantity,
      image: product.image,
      type: product.type,
      selectedPrice: finalPrice,
      storeId: product.storeId ? String(product.storeId) : undefined
    })
  }

  const handleBuyNow = () => {
    saveScheduleToStorage(scheduledTime)
    addToCart({
      id: product.id || product._id,
      name: product.name,
      price: finalPrice,
      weight: selectedWeight.weight,
      quantity,
      image: product.image,
      type: product.type,
      selectedPrice: finalPrice,
      storeId: product.storeId ? String(product.storeId) : undefined
    })
    router.push('/cart')
  }

  return (
    <div className="space-y-5">
      {/* Schedule Time Selector */}
      <div className="flex items-center gap-3">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-indigo-500" />
          Schedule:
        </label>
        <div className="relative inline-block w-auto">
          <select
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="appearance-none rounded-full border border-indigo-200 bg-indigo-50 pl-3 pr-8 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all cursor-pointer min-w-[140px]"
          >
            <option value="No Schedule">ASAP</option>
            {scheduleSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
            <svg className="h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Weight Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Select Weight</label>
        <div className="flex gap-2 flex-wrap">
          {productWeights.map((w) => (
            <button
              key={w.weight}
              onClick={() => setSelectedWeight(w)}
              className={`rounded-2xl border px-5 py-2 text-sm font-medium transition-all ${
                selectedWeight.weight === w.weight
                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {w.weight}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 rounded-2xl border bg-white p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setQuantity(quantity + 1)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Total:</span>
            <span className="text-2xl font-black text-primary">₹{finalPrice * quantity}</span>
            {selectedWeight.cuttedPrice && selectedWeight.cuttedPrice > finalPrice && (
              <span className="text-sm text-gray-400 line-through font-medium">₹{selectedWeight.cuttedPrice * quantity}</span>
            )}
          </div>
          {selectedWeight.cuttedPrice && selectedWeight.cuttedPrice > finalPrice && (
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1">
              SAVE ₹{(selectedWeight.cuttedPrice - finalPrice) * quantity} ({Math.round(((selectedWeight.cuttedPrice - finalPrice) / selectedWeight.cuttedPrice) * 100)}% OFF)
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        {product.isAvailable === false ? (
          <Button disabled className="flex-1 rounded-2xl py-6 text-base bg-gray-400" size="lg">Unavailable</Button>
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

      <div className="flex items-center gap-2 pt-2 justify-center sm:justify-start">
        <Button variant="link" className="text-muted-foreground h-auto p-0">
          <Share2 className="mr-2 h-4 w-4" /> Share this cake
        </Button>
      </div>
    </div>
  )
}

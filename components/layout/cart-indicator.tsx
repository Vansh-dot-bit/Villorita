"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { useEffect, useState } from "react"

export function CartIndicator() {
  const { items } = useCart()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const count = items.reduce((acc, item) => acc + item.quantity, 0)

  if (!mounted) {
    return (
        <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
            </Link>
        </Button>
    )
  }

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
            {count}
            </span>
        )}
        <span className="sr-only">Cart</span>
      </Link>
    </Button>
  )
}

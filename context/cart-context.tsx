"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

export type CartItem = {
  id: string // This is productId
  _id?: string // This is the unique cart item ID from backend
  name: string
  price: number
  weight: string
  quantity: number
  image: string
  type: "Eggless" | "Contains Egg"
  selectedPrice: number
}

export type CartAddon = {
  addon: string // Addon ID
  name: string
  price: number
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addons: CartAddon[]
  addToCart: (item: CartItem) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  addAddonToCart: (addonId: string, quantity: number) => Promise<void>
  removeAddonFromCart: (addonId: string) => Promise<void>
  clearCart: () => Promise<void>
  cartTotal: number
  addonTotal: number
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [addons, setAddons] = useState<CartAddon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, token } = useAuth()

  // Load from LocalStorage on Mount (if not logged in)
  useEffect(() => {
    if (!token) {
        const savedCart = localStorage.getItem("cart")
        const savedAddons = localStorage.getItem("cartAddons")
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error("Failed to parse cart from local storage", e)
                localStorage.removeItem("cart")
            }
        }
        if (savedAddons) {
            try {
                setAddons(JSON.parse(savedAddons))
            } catch (e) {
                console.error("Failed to parse cart addons from local storage", e)
                localStorage.removeItem("cartAddons")
            }
        }
        setIsLoading(false)
    }
  }, [token])

  // Save to LocalStorage whenever items change (if not logged in)
  useEffect(() => {
    if (!token && !isLoading) {
        localStorage.setItem("cart", JSON.stringify(items))
        localStorage.setItem("cartAddons", JSON.stringify(addons))
    }
  }, [items, addons, token, isLoading])


  // Fetch Cart from Backend
  const fetchCart = async () => {
    if (!token) return

    try {
      setIsLoading(true)
      const res = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success && data.cart) {
        const backendItems = data.cart.items
            .filter((item: any) => item.product) // Safety check
            .map((item: any) => ({
                id: item.product._id,
                _id: item._id,
                name: item.name || item.product.name, // Fallback
                price: item.price, 
                weight: item.weight,
                quantity: item.quantity,
                image: item.image || item.product.image, // Fallback
                type: item.product.type || "Eggless", // Fallback
                selectedPrice: item.selectedPrice
            }))
        setItems(backendItems)
        
        if (data.cart.addons) {
            setAddons(data.cart.addons.map((a: any) => ({
                addon: a.addon,
                name: a.name,
                price: a.price,
                quantity: a.quantity
            })))
        } else {
            setAddons([])
        }
      }
    } catch (error) {
      console.error("Failed to fetch cart", error)
    } finally {
        setIsLoading(false)
    }
  }

  // Sync Local Cart to Backend (on login)
  const syncLocalCartToBackend = async () => {
    const localCart = localStorage.getItem("cart")
    const localAddons = localStorage.getItem("cartAddons")
    
    if (localCart) {
        const localItems: CartItem[] = JSON.parse(localCart)
        
        // Push all local items to backend
        for (const item of localItems) {
            try {
                await fetch('/api/cart', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        productId: item.id,
                        quantity: item.quantity,
                        weight: item.weight
                    })
                })
            } catch (e) {
                console.error("Sync error", e)
            }
        }
        // Clear local storage after sync attempt
        localStorage.removeItem("cart")
    }

    if (localAddons) {
        const localAddonsParsed: CartAddon[] = JSON.parse(localAddons)
        for (const addon of localAddonsParsed) {
            try {
                await fetch('/api/cart/addon', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        addonId: addon.addon,
                        quantity: addon.quantity
                    })
                })
            } catch (e) {
                console.error("Sync addon error", e)
            }
        }
        localStorage.removeItem("cartAddons")
    }
    
    // After syncing, fetch fresh state from backend
    fetchCart()
  }

  // Initial Sync / Load when Token Changes
  useEffect(() => {
    if (token) {
        syncLocalCartToBackend()
    } else {
        // If logging out, we might want to clear items or keep them based on requirements.
        // For now, let's keep them empty or load from LS if any (unlikely effectively unless we implemented persistence across logout)
        // setItems([]) 
    }
  }, [token])


  const addToCart = async (newItem: CartItem) => {
    // 1. Optimistic UI Update
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id && i.weight === newItem.weight)
      if (existing) {
        return prev.map((i) => 
          (i.id === newItem.id && i.weight === newItem.weight)
            ? { ...i, quantity: i.quantity + newItem.quantity } 
            : i
        )
      }
      return [...prev, newItem]
    })
    
    toast.success("Added to cart")

    // 2. Backend Update
    if (token) {
        try {
            console.log("[CartContext] Sending to backend:", { productId: newItem.id, quantity: newItem.quantity, weight: newItem.weight });
            const postRes = await fetch('/api/cart', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    productId: newItem.id,
                    quantity: newItem.quantity,
                    weight: newItem.weight
                })
            })

            console.log("[CartContext] Backend response status:", postRes.status);
            const postData = await postRes.json();
            console.log("[CartContext] Backend response data:", postData);

            if (!postRes.ok) {
                console.error("[CartContext] Failed to add to backend cart:", postData);
                toast.error(postData.error || "Failed to sync with server");
                return; // Stop if failed
            }

            // Use the cart returned from the backend response
            if(postData.success && postData.cart) {
                 const backendItems = postData.cart.items
                    .filter((item: any) => item.product)
                    .map((item: any) => ({
                        id: item.product._id,
                        _id: item._id,
                        name: item.name || item.product.name,
                        price: item.price, 
                        weight: item.weight,
                        quantity: item.quantity,
                        image: item.image || item.product.image,
                        type: item.product.type || "Eggless",
                        selectedPrice: item.selectedPrice
                    }))
                 setItems(backendItems)
            }

        } catch (error) {
            console.error("Add to cart failed", error)
            toast.error("Failed to save to account")
            // Revert on failure not implemented for simplicity, but recommended for prod
        }
    }
  }

  const removeFromCart = async (itemId: string) => {
    // Determine if we are removing by productId (local/optimistic) or _id (backend)
    const itemToRemove = items.find(i => i.id === itemId || i._id === itemId)
    if (!itemToRemove) return

    // Optimistic Update
    setItems((prev) => prev.filter((i) => i.id !== itemId && i._id !== itemId))
    toast.success("Removed from cart")

    if (token) {
        try {
            // If it has a backend _id, use it. If not (rare race condition), use fetch to find it? 
            // The item in 'items' should have _id if it was fetched from backend.
            // If it was just added and not yet synced with _id, this might fail if we only use _id.
            // Our add logic refetches, so it should be fine.
            const idToDelete = itemToRemove._id 
            
            if (idToDelete) {
                await fetch(`/api/cart?itemId=${idToDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            }
        } catch (error) {
            console.error("Remove from cart failed", error)
        }
    }
  }

  const addAddonToCart = async (addonId: string, quantity: number) => {
      // Optimistic logic would require full addon details, but we only have ID here ideally.
      // So let's fetch it, or assume it's synced from backend. Since we only add from cart view where we have details:
      // It's safer to just let backend do it and refetch/update.
      if (!token) {
          toast.warning("Please login to add addons");
          return;
      }

      try {
          const res = await fetch('/api/cart/addon', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ addonId, quantity })
          });
          const data = await res.json();
          if (data.success && data.cart) {
              setAddons((data.cart.addons || []).map((a: any) => ({
                addon: a.addon,
                name: a.name,
                price: a.price,
                quantity: a.quantity
              })));
              toast.success("Addon added to cart");
          } else {
              toast.error(data.error || "Failed to add addon");
          }
      } catch (err) {
          console.error(err);
      }
  }

  const removeAddonFromCart = async (addonId: string) => {
      setAddons(prev => prev.filter(a => a.addon !== addonId));
      if (!token) return;

      try {
          const res = await fetch(`/api/cart/addon?addonId=${addonId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.cart) {
              setAddons((data.cart.addons || []).map((a: any) => ({
                addon: a.addon,
                name: a.name,
                price: a.price,
                quantity: a.quantity
              })));
          }
      } catch(err) {
          console.error(err);
      }
  }

  const clearCart = async () => {
    setItems([])
    setAddons([])
    localStorage.removeItem("cart")
    localStorage.removeItem("cartAddons")
    
    if (token) {
        try {
            await fetch('/api/cart', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
        } catch (error) {
            console.error("Clear cart failed", error)
        }
    }
  }

  const cartTotal = items.reduce((total, item) => total + (item.selectedPrice * item.quantity), 0)
  const addonTotal = addons.reduce((total, addon) => total + (addon.price * addon.quantity), 0)

  return (
    <CartContext.Provider value={{ items, addons, addToCart, removeFromCart, addAddonToCart, removeAddonFromCart, clearCart, cartTotal, addonTotal, isLoading }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

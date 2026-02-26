import { Header } from "@/components/layout/header"
import { CartView } from "@/components/cart/cart-view"

export default function CartPage() {
  return (
    <div className="min-h-screen bg-secondary/30">
        <Header />
        
        {/* Page Title Banner */}
        <div className="mb-8 w-full bg-zinc-200 py-12 text-center text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <h1 className="text-3xl font-black tracking-widest uppercase opacity-80">Cart</h1>
        </div>

        <main className="container mx-auto px-4 pb-20">
            <CartView />
        </main>
    </div>
  )
}

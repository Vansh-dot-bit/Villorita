import Link from "next/link"
import { Check, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OrderSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
        <Check className="h-10 w-10 text-green-600" strokeWidth={3} />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Order Placed!</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Yay! Your order <span className="font-bold text-foreground">#928374</span> has been successfully placed. We are baking it with love!
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Button className="w-full rounded-2xl py-6" asChild>
            <Link href="/profile">Track Order</Link>
        </Button>
        <Button variant="ghost" className="w-full rounded-2xl py-6" asChild>
            <Link href="/"> <Home className="mr-2 h-4 w-4" /> Go to Home</Link>
        </Button>
      </div>
    </div>
  )
}

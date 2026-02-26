import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import { format } from "date-fns"
import Link from "next/link"
import { Plus, Trash2, Edit } from "lucide-react"
import { deleteCouponAction } from "./actions"
import { WalletCashbackRequests } from "./wallet-cashback-requests"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getCoupons() {
  await dbConnect()
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean()
  return JSON.parse(JSON.stringify(coupons))
}

export default async function CouponsPage() {
  const coupons = await getCoupons()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
        <Button asChild>
            <Link href="/admin/coupons/new">
                <Plus className="mr-2 h-4 w-4" /> Create Coupon
            </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
            {coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-4">No coupons found.</p>
                    <Button variant="outline" asChild>
                        <Link href="/admin/coupons/new">Create your first coupon</Link>
                    </Button>
                </div>
            ) : (
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Code</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Discount</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Expiry</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Used</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {coupons.map((coupon: any) => (
                                <tr key={coupon._id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-bold">{coupon.code}</td>
                                    <td className="p-4 align-middle">
                                        <Badge variant="secondary">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} Off
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle capitalize">{coupon.discountType}</td>
                                    <td className="p-4 align-middle">
                                        <span className={new Date(coupon.expiryDate) < new Date() ? "text-red-500 font-medium" : ""}>
                                            {format(new Date(coupon.expiryDate), "PP")}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-muted-foreground">
                                        {coupon.usedCount} times
                                    </td>
                                    <td className="p-4 align-middle text-right flex justify-end gap-2">
                                        <form action={deleteCouponAction.bind(null, coupon._id)}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </CardContent>
      </Card>

      {/* Wallet Cashback Requests Section */}
      <WalletCashbackRequests />
    </div>
  )
}

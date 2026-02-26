'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCouponAction } from "../actions"
import { Card, CardContent } from "@/components/ui/card"

export default function NewCouponPage() {
  return (
    <div className="max-w-xl mx-auto space-y-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Coupon</h1>
            <p className="text-muted-foreground">Add a new discount code for your customers.</p>
        </div>

        <Card className="border-none shadow-sm">
            <CardContent className="p-6">
                <form action={createCouponAction} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input id="code" name="code" placeholder="e.g. SUMMER50" className="uppercase" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="discountType">Discount Type</Label>
                            <Select name="discountType" defaultValue="percentage">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                    <SelectItem value="wallet">💰 Wallet Cashback</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Wallet cashback adds amount to user's wallet (no discount on current order)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discountValue">Value</Label>
                            <Input id="discountValue" name="discountValue" type="number" placeholder="50" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
                        <Input id="minOrderAmount" name="minOrderAmount" type="number" defaultValue="0" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="usageLimit">Total Usage Limit</Label>
                            <Input id="usageLimit" name="usageLimit" type="number" placeholder="Unlimited" />
                            <p className="text-xs text-muted-foreground">Max times coupon can be used in total</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="usageLimitPerUser">Usage Limit Per User</Label>
                            <Input id="usageLimitPerUser" name="usageLimitPerUser" type="number" placeholder="Unlimited" />
                            <p className="text-xs text-muted-foreground">Max times a single user can use this</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input id="expiryDate" name="expiryDate" type="date" required />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                        Create Coupon
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  )
}

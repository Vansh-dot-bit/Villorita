/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Truck, CheckCircle, XCircle, IndianRupee, Percent, TrendingUp } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/layout/header"
import { toast } from "sonner"

export default function VendorDashboard() {
  const [stats, setStats] = useState({ pending: 0, delivering: 0, completed: 0, cancelled: 0, todayOrders: 0 })
  const [earnings, setEarnings] = useState<any>(null)
  const { token } = useAuth()

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/vendor/orders', { headers: { 'Authorization': `Bearer ${token}` } })
        const data = await res.json()
        if (data.success) {
          const orders = data.orders
          setStats({
            pending:   orders.filter((o: any) => o.orderStatus?.toLowerCase() === 'preparing your cake').length,
            delivering: orders.filter((o: any) => o.orderStatus?.toLowerCase() === 'out for delivery').length,
            completed: orders.filter((o: any) => o.orderStatus?.toLowerCase() === 'delivered').length,
            cancelled: orders.filter((o: any) => o.orderStatus?.toLowerCase() === 'cancelled').length,
            todayOrders: orders.filter((o: any) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length,
          })
        }
      } catch (error: any) {
        console.error("Stats Fetch Error:", error)
      }
    }

    const fetchEarnings = async () => {
      try {
        const res = await fetch('/api/vendor/earnings', { headers: { 'Authorization': `Bearer ${token}` } })
        const data = await res.json()
        if (data.success) setEarnings(data.earnings)
      } catch (e) {
        console.error('Earnings fetch error', e)
      }
    }

    fetchStats()
    fetchEarnings()
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

        {/* Earnings Section */}
        {earnings && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              Revenue Breakdown
              {earnings.storeName && <span className="ml-2 text-sm text-muted-foreground font-normal">— {earnings.storeName}</span>}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  <IndianRupee className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">₹{earnings.total?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">All paid orders</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Your Earnings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-700">₹{earnings.vendorShare?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">After {earnings.adminCutPercentage}% admin cut</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-orange-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Admin Cut</CardTitle>
                  <Percent className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">₹{earnings.adminCut?.toLocaleString()}</div>
                  <p className="text-xs text-orange-600/70 mt-1">{earnings.adminCutPercentage}% platform fee</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Order Status Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Order Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preparing</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Orders to prepare</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.delivering}</div>
                <p className="text-xs text-muted-foreground">Orders on the way</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Total delivered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cancelled}</div>
                <p className="text-xs text-muted-foreground">Cancelled orders</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

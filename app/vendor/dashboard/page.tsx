/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag, Truck, CheckCircle, XCircle, IndianRupee, Percent, TrendingUp, Store, Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/layout/header"
import { toast } from "sonner"

export default function VendorDashboard() {
  const [stats, setStats] = useState({ pending: 0, delivering: 0, completed: 0, cancelled: 0, todayOrders: 0 })
  const [earnings, setEarnings] = useState<any>(null)
  const [storeInfo, setStoreInfo] = useState<{ _id: string; name: string; isActive: boolean } | null>(null)
  const [storeLoading, setStoreLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
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

    const fetchStore = async () => {
      try {
        setStoreLoading(true)
        const res = await fetch('/api/vendor/store', { headers: { 'Authorization': `Bearer ${token}` } })
        const data = await res.json()
        if (data.success && data.store) {
          setStoreInfo({ _id: data.store._id, name: data.store.name, isActive: data.store.isActive })
        }
      } catch (e) {
        console.error('Store fetch error', e)
      } finally {
        setStoreLoading(false)
      }
    }

    fetchStats()
    fetchEarnings()
    fetchStore()
  }, [token])

  const handleToggleAvailability = async () => {
    if (!storeInfo || toggling) return;
    const newStatus = !storeInfo.isActive;
    setToggling(true)
    try {
      const res = await fetch('/api/vendor/store', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setStoreInfo(prev => prev ? { ...prev, isActive: newStatus } : prev)
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Failed to update store status')
      }
    } catch (e) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

        {/* Store Availability Toggle */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Store Status</h2>
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              {storeLoading ? (
                <div className="flex items-center justify-center p-8 gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading store status...</span>
                </div>
              ) : !storeInfo ? (
                <div className="flex items-center gap-3 p-6 text-muted-foreground text-sm">
                  <Store className="h-5 w-5" />
                  <span>No store assigned to your account yet.</span>
                </div>
              ) : (
                <div className={`flex items-center justify-between p-6 border-l-4 transition-colors ${storeInfo.isActive ? 'border-l-green-400 bg-green-50/40' : 'border-l-red-400 bg-red-50/40'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${storeInfo.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Store className={`h-6 w-6 ${storeInfo.isActive ? 'text-green-600' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-base">{storeInfo.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${storeInfo.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${storeInfo.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        </span>
                        <span className={`text-sm font-medium ${storeInfo.isActive ? 'text-green-700' : 'text-red-600'}`}>
                          {storeInfo.isActive ? 'Available to customers' : 'Unavailable — hidden from customers'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={handleToggleAvailability}
                    disabled={toggling}
                    aria-label="Toggle store availability"
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${storeInfo.isActive ? 'bg-green-500 focus:ring-green-400' : 'bg-gray-300 focus:ring-gray-400'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${storeInfo.isActive ? 'translate-x-8' : 'translate-x-1'}`}
                    >
                      {toggling && (
                        <Loader2 className="h-3 w-3 text-gray-400 animate-spin m-auto mt-1" />
                      )}
                    </span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
          {storeInfo && (
            <p className="text-xs text-muted-foreground px-1">
              {storeInfo.isActive
                ? 'Your store is live. Toggle off to temporarily close it.'
                : 'Your store is closed. Customers will see an "Unavailable" notice. Toggle on to reopen.'}
            </p>
          )}
        </div>

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

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingBag, Users, TrendingUp, Truck, Tag, Percent, CreditCard, CheckCircle, Wallet } from "lucide-react"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

export default function AdminDashboard() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [lifetime, setLifetime] = useState<any>(null)
  const [monthly, setMonthly] = useState<any>(null)
  const [weekly, setWeekly] = useState<any>(null)
  const [codData, setCodData] = useState({ totalAmount: 0, count: 0 })
  const [codOrders, setCodOrders] = useState<any[]>([])
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    }
  }, [token])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success) {
        setLifetime(data.lifetime)
        setMonthly(data.monthly)
        setWeekly(data.weekly)
        setCodData(data.codData)
        setCodOrders(data.codOrders || [])
        setRecentOrders(data.recentOrders)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (orderId: string) => {
    setMarkingPaid(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'verify_payment' })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Payment marked as collected!')
        fetchDashboardData() // Refresh data
      } else {
        toast.error(data.error || 'Failed to mark payment')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setMarkingPaid(null)
    }
  }

  if (loading || !lifetime) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>
  }

  // Reusable Section Component
  const MetricSection = ({ title, data }: { title: string, data: any }) => (
      <div className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight">{title} Metrics</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-green-700">₹{data.grossRevenue?.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total paid by customers</p>
                  </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
                      <Percent className="h-4 w-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-indigo-700">₹{data.platformRevenue?.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">Admin's % cut from sales</p>
                  </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Vendor Payout</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-orange-600">₹{data.vendorRevenue?.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">Vendor's share of sales</p>
                  </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Earnings</CardTitle>
                      <Truck className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-blue-600">₹{data.delivery?.toLocaleString() || 0}</div>
                  </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Addons Earnings</CardTitle>
                      <Tag className="h-4 w-4 text-pink-500" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-pink-600">₹{data.addonsTotal?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">Platform revenue from addons</p>
                  </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Refunds</CardTitle>
                      <img src="https://api.iconify.design/lucide:rotate-ccw.svg" className="h-4 w-4 text-red-500 opacity-50" alt="" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-red-600">₹{data.refunds?.toLocaleString() || 0}</div>
                  </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Coupon Discounts</CardTitle>
                      <Tag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-red-600">-₹{data.coupons?.toLocaleString()}</div>
                  </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Usage</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-purple-600">-₹{data.wallet?.toLocaleString() || 0}</div>
                  </CardContent>
              </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-1">
               <Card className="border-none shadow-sm bg-indigo-50/50">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-indigo-900">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-indigo-700">₹{data.netProfit?.toLocaleString()}</div>
                      <p className="text-xs text-indigo-600/80">Platform Revenue + Delivery + Addons − Refunds − Coupons − Wallet</p>
                  </CardContent>
               </Card>
          </div>
      </div>
  )

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span>Real-time Analytics</span>
        </div>
      </div>

      {/* 1. Lifetime Section */}
      <MetricSection title="Lifetime" data={lifetime} />

      <div className="my-8 border-t border-dashed" />

      {/* 2. Monthly Section */}
      <MetricSection title="Current Month" data={monthly} />

       <div className="my-8 border-t border-dashed" />

      {/* 3. Weekly Section */}
      <MetricSection title="This Week" data={weekly} />

      <div className="my-8 border-t border-dashed" />

      {/* COD Collection Pending Section */}
      <div className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              COD Collection Pending
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-none shadow-sm bg-amber-50">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-amber-900">
                          Pending COD Amount
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold text-amber-700">
                          ₹{codData.totalAmount.toLocaleString()}
                      </div>
                      <p className="text-xs text-amber-600/80 mt-1">
                          {codData.count} delivered orders awaiting payment
                      </p>
                  </CardContent>
              </Card>
              
              <Card className="border-none shadow-sm bg-white">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                          Orders Count
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">
                          {codData.count}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                          Total delivered COD orders
                      </p>
                  </CardContent>
              </Card>
          </div>
          <p className="text-xs text-muted-foreground italic">
              💡 These amounts will be added to revenue once payment status is updated to "Paid"
          </p>
          
          {/* COD Orders List */}
          {codOrders.length > 0 && (
              <Card className="border-none shadow-sm mt-4">
                  <CardHeader>
                      <CardTitle className="text-base">Delivered COD Orders - Awaiting Payment Collection</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-3">
                          {codOrders.map((order: any) => (
                              <div key={order._id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-1">
                                          <p className="font-bold">Order #{order._id.slice(-6).toUpperCase()}</p>
                                          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">COD</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                          {order.user?.name || 'Guest'} • {format(new Date(order.createdAt), 'PPP')}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                          {order.items.length} item(s)
                                      </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="text-right">
                                          <p className="text-sm text-muted-foreground">Amount</p>
                                          <p className="text-xl font-bold text-amber-700">₹{order.totalAmount.toLocaleString()}</p>
                                      </div>
                                      <Button
                                          onClick={() => handleMarkPaid(order._id)}
                                          disabled={markingPaid === order._id}
                                          className="bg-green-600 hover:bg-green-700"
                                      >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          {markingPaid === order._id ? 'Marking...' : 'Mark as Paid'}
                                      </Button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          )}
      </div>

      {/* Recent Orders Table */}
      <Card className="border-none shadow-sm mt-8">
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No recent orders.</p>
                ) : (
                  recentOrders.map((order: any) => (
                    <div key={order._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {order.items[0]?.name?.charAt(0) || 'O'}
                            </div>
                            <div>
                                <p className="text-sm font-bold">Order #{order._id.toString().slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(order.createdAt), "MMM d, h:mm a")}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-sm font-bold">₹{order.totalAmount}</p>
                             <p className={`text-xs ${
                               order.paymentStatus === 'Paid' ? 'text-green-600' : 
                               order.paymentStatus === 'Failed' ? 'text-red-600' : 'text-yellow-600'
                             }`}>
                               {order.paymentStatus}
                             </p>
                        </div>
                    </div>
                  ))
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client';

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Package, TrendingUp, Calendar, ShoppingBag } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

export default function VendorFinancialPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [metrics, setMetrics] = useState({ totalRevenue: 0, orderCount: 0 })
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      fetchFinancialData()
    }
  }, [token])

  const fetchFinancialData = async () => {
    try {
      const res = await fetch('/api/vendor/financial', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success) {
        setOrders(data.orders)
        setMetrics(data.metrics)
      } else {
        toast.error(data.error || "Failed to fetch financial data")
      }
    } catch (error) {
      toast.error("Error loading financial data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financial Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your revenue from delivered orders</p>
      </div>
      
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-900">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              ₹{metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-green-600/80 mt-1">Based on cost prices</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Delivered Orders
              </CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.orderCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed deliveries</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Order Value
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{metrics.orderCount > 0 
                ? Math.round(metrics.totalRevenue / metrics.orderCount).toLocaleString() 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per order revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Revenue Breakdown by Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading financial data...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground font-medium">No delivered orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Revenue will appear here once orders are delivered</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order._id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">Order #{order._id.slice(-6).toUpperCase()}</p>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Delivered</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.createdAt), "PPP")}
                        </div>
                        <span>•</span>
                        <span>{order.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Customer Paid</p>
                      <p className="font-bold text-gray-700">₹{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Items Breakdown */}
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Items</p>
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{item.quantity}x {item.name}</span>
                          <span className="text-muted-foreground ml-2">({item.weight})</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <p className="text-muted-foreground">Cost Price</p>
                            <p className="font-medium">₹{item.costPrice}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">Subtotal</p>
                            <p className="font-bold text-green-700">₹{item.itemRevenue}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Total */}
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="font-bold text-gray-700">Your Revenue from this Order</span>
                    <span className="text-xl font-bold text-green-700">₹{order.vendorRevenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

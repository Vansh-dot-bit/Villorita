'use client';

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

export default function VerifyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)

  const fetchPendingOrders = async () => {
      try {
          const res = await fetch('/api/orders?status=pending_verification') // We need to update API to support this filter or just fetch all and filter client side for now as optimization
          // For now, let's fetch all and filter
          const resAll = await fetch('/api/orders?limit=50')
          const data = await resAll.json()
          
          if (data.success) {
              const pending = data.orders.filter((o: any) => 
                  o.orderStatus === 'punched' || o.orderStatus === 'Pending'
              )
              setOrders(pending)
          }
      } catch (error) {
          toast.error("Failed to fetch orders")
      } finally {
          setLoading(false)
      }
  }

  useEffect(() => {
      fetchPendingOrders()
  }, [])

  const handleVerify = async (orderId: string) => {
      setVerifying(orderId)
      try {
          const res = await fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'admin_verify' })
          })
          const data = await res.json()
          if (data.success) {
              toast.success("Order verified. Status: Preparing your cake")
              // Remove from list
              setOrders(orders.filter(o => o._id !== orderId))
          } else {
              toast.error(data.error || "Failed to verify")
          }
      } catch (error) {
          toast.error("Something went wrong")
      } finally {
          setVerifying(null)
      }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Verify Orders</h1>
            <p className="text-muted-foreground">Review and verify new orders.</p>
          </div>
          <Button variant="outline" onClick={fetchPendingOrders}>Refresh</Button>
      </div>

      {loading ? (
          <div className="text-center py-12">Loading pending orders...</div>
      ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <h3 className="font-bold text-lg">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending orders to verify.</p>
              </div>
          </div>
      ) : (
          <div className="grid gap-4">
              {orders.map((order) => (
                  <Card key={order._id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                          <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                  <span className="font-bold text-lg">#{order._id.slice(-6).toUpperCase()}</span>
                                  <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                                      {order.paymentStatus}
                                  </Badge>
                                  <Badge variant="outline">{order.paymentMethod}</Badge>
                                  {order.orderStatus === 'punched' && <Badge className="bg-blue-500">Punched</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground flex gap-4">
                                  <span>{format(new Date(order.createdAt), "PPP p")}</span>
                                  <span>•</span>
                                  <span>{order.user?.name || "Guest"}</span>
                                  <span>•</span>
                                  <span className="font-bold text-primary">₹{order.totalAmount}</span>
                              </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto">
                              <Link href={`/admin/orders/${order._id}`}>
                                <Button variant="ghost" size="sm">
                                    Details <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                              
                              <Button 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleVerify(order._id)}
                                disabled={verifying === order._id}
                              >
                                {verifying === order._id ? 'Verifying...' : 'Verify Order'}
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
      )}
    </div>
  )
}

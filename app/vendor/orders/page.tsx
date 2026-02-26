/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Truck, MapPin, Phone, Gift, Mail } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/layout/header"

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [adminCutPercentage, setAdminCutPercentage] = useState(0)
  
  // Action States
  const [markingId, setMarkingId] = useState<string | null>(null)

  const { user, token } = useAuth()

  const fetchOrders = async () => {
    setLoading(true)
    const authToken = token || localStorage.getItem('token')

    if (!authToken) {
        setLoading(false)
        return
    }

    try {
      const res = await fetch('/api/vendor/orders', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error ${res.status}: ${errorText.substring(0, 50)}`);
      }
      
      const data = await res.json()
      if (data.success) {
        const sorted = data.orders.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted)
        setAdminCutPercentage(data.adminCutPercentage || 0)
      } else {
        toast.error("Failed to fetch orders")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && (user.role === 'vendor' || user.role === 'admin' || user.role === 'superadmin')) {
      fetchOrders()
    } else {
        setLoading(false)
    }
  }, [user, token])

  const handleMarkOutForDelivery = async (orderId: string) => {
      setMarkingId(orderId)
      const authToken = token || localStorage.getItem('token')
      try {
          const res = await fetch(`/api/vendor/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ 
                  action: 'mark_out_for_delivery'
              })
          })
          const data = await res.json()
          if (data.success) {
              toast.success("Order sent to delivery agent!")
              fetchOrders()
          } else {
              toast.error(data.error || "Failed to send order to agent")
          }
      } catch (error) {
          toast.error("Something went wrong")
      } finally {
          setMarkingId(null)
      }
  }

  // Filter orders based on status
  let filteredOrders = orders
  if (statusFilter === 'All') {
      filteredOrders = orders
  } else if (statusFilter === 'Preparing') {
    filteredOrders = orders.filter(o => o.orderStatus === 'preparing your cake')
  } else if (statusFilter === 'Awaiting Agent') {
    filteredOrders = orders.filter(o => o.orderStatus === 'Awaiting Agent')
  } else if (statusFilter === 'Out for Delivery') {
    filteredOrders = orders.filter(o => o.orderStatus === 'Out for Delivery')
  } else if (statusFilter === 'Delivered') {
    filteredOrders = orders.filter(o => o.orderStatus === 'Delivered')
  } else if (statusFilter === 'Cancelled') {
      filteredOrders = orders.filter(o => o.orderStatus === 'Cancelled')
  }

  if (!user || (user.role !== 'vendor' && user.role !== 'admin' && user.role !== 'superadmin')) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <p>Access Denied. Vendor access only.</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Vendor Dashboard</h1>
        <Button onClick={fetchOrders} variant="outline" size="sm">Refresh</Button>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="flex items-center gap-2 border-b pb-1 overflow-x-auto mb-6">
          {['Preparing', 'Awaiting Agent', 'Out for Delivery', 'Delivered', 'Cancelled', 'All'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    statusFilter === tab 
                    ? 'bg-white border-b-2 border-primary text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
              >
                  {tab}
              </button>
          ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">Loading orders...</div>
      ) : (
        <div className="grid gap-4">
            {filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No orders found in "{statusFilter}"</p>
                </div>
            ) : (
                filteredOrders.map(order => (
                    <Card key={order._id} className={`border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow ${order.orderStatus === 'Cancelled' ? 'opacity-75 bg-red-50/30' : ''}`}>
                        <div className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  {/* Order Header Info */}
                                  <div className="space-y-1">
                                      <div className="flex items-center gap-3">
                                          <span className="text-lg font-bold">#{order._id.toString().slice(-6).toUpperCase()}</span>
                                          <Badge variant={
                                              order.orderStatus === 'Delivered' ? 'default' : 
                                              order.orderStatus === 'Cancelled' ? 'destructive' : 
                                              'secondary'
                                          } className={
                                              order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                              order.orderStatus === 'Awaiting Agent' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                                              order.orderStatus === 'Out for Delivery' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                              order.orderStatus === 'punched' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                              order.orderStatus === 'preparing your cake' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                                              ''
                                          }>
                                              {order.orderStatus}
                                          </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                          Placed on {format(new Date(order.createdAt), "PPP 'at' p")}
                                      </p>
                                  </div>

                                  {/* Customer Info */}
                                  <div className="flex items-center gap-4 text-sm">
                                      <div className="text-right">
                                          <p className="font-medium">{order.shippingAddress?.name || order.user?.name}</p>
                                          <div className="flex items-center gap-1 justify-end text-muted-foreground">
                                              <Phone className="h-3 w-3" />
                                              <span>{order.shippingAddress?.phone}</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                                
                              {order.orderStatus === 'Cancelled' && (
                                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-800">
                                      <span className="font-semibold">Cancelled:</span> {order.cancellationRequest?.reason || 'Order cancelled'}
                                  </div>
                              )}

                              <div className="mt-6 flex flex-col md:flex-row gap-6">
                                  {/* Items Preview */}
                                  <div className="flex-1 space-y-3">
                                      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Items</div>
                                      <div className="space-y-2">
                                          {order.items.map((item: any, idx: number) => (
                                              <div key={idx} className="flex items-center justify-between text-sm">
                                                  <div className="flex items-center gap-2">
                                                      <span className="font-medium text-gray-700">{item.quantity}x</span>
                                                      <span>{item.name}</span>
                                                      {item.weight && <span className="text-xs text-muted-foreground">({item.weight})</span>}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                      
                                      {order.addons && order.addons.length > 0 && (
                                          <div className="mt-3 space-y-2">
                                              <div className="text-xs font-semibold uppercase text-pink-500 tracking-wider flex items-center gap-1"><Gift className="h-3 w-3" /> Add-ons</div>
                                              {order.addons.map((addon: any, idx: number) => (
                                                  <div key={idx} className="flex items-center justify-between text-sm border-b border-pink-100/50 pb-2 last:border-0 last:pb-0">
                                                      <div className="flex items-center gap-2">
                                                          <span className="font-semibold text-pink-500">{addon.quantity}x</span>
                                                          <span className="text-pink-700">{addon.name}</span>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}

                                      {/* Occasion & Message Details */}
                                      {(order.occasion || order.cakeMessage) && (
                                          <div className="mt-4 pt-3 border-t border-dashed space-y-2">
                                              {order.occasion && (
                                                  <div className="flex items-start gap-2 text-sm">
                                                      <Gift className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                                                      <div>
                                                          <span className="font-semibold text-gray-700">Occasion:</span> {order.occasion}
                                                          {order.occasionName && <span className="text-gray-600"> ({order.occasionName})</span>}
                                                      </div>
                                                  </div>
                                              )}
                                              {order.cakeMessage && (
                                                  <div className="flex items-start gap-2 text-sm">
                                                      <Mail className="h-4 w-4 text-pink-500 mt-0.5 shrink-0" />
                                                      <div>
                                                          <span className="font-semibold text-gray-700">Message on Cake:</span>
                                                          <p className="italic text-gray-600 bg-pink-50 px-2 py-1 rounded mt-1 inline-block">"{order.cakeMessage}"</p>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                      
                                      {/* Revenue Breakdown */}
                                      <div className="mt-4 pt-4 border-t border-gray-100">
                                          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Revenue Breakdown</div>
                                          {(() => {
                                              const itemTotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
                                              const adminCut = Math.round(itemTotal * adminCutPercentage / 100)
                                              const vendorShare = itemTotal - adminCut
                                              
                                              return (
                                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                                      <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100">
                                                          <div className="text-xs text-indigo-600/80 mb-0.5">Your Earnings</div>
                                                          <div className="font-bold text-indigo-700">₹{vendorShare}</div>
                                                      </div>
                                                      <div className="bg-orange-50/50 p-2 rounded border border-orange-100">
                                                          <div className="text-xs text-orange-600/80 mb-0.5">Admin Cut ({adminCutPercentage}%)</div>
                                                          <div className="font-semibold text-orange-700">₹{adminCut}</div>
                                                      </div>
                                                  </div>
                                              )
                                          })()}
                                      </div>
                                  </div>
                                  
                                  {/* Actions / Details */}
                                  <div className="w-full md:w-64 space-y-3 border-l pl-0 md:pl-6 border-dashed">
                                      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Delivery Details</div>
                                      <div className="text-sm space-y-1">
                                          <div className="flex items-start gap-2">
                                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                              <div>
                                                  <p className="font-medium text-gray-900">{order.shippingAddress?.addressLine1}</p>
                                                  <p className="text-muted-foreground">{order.shippingAddress?.city}, {order.shippingAddress?.pincode}</p>
                                                  {order.shippingAddress?.addressLine2 && <p className="text-muted-foreground text-xs">{order.shippingAddress?.addressLine2}</p>}
                                              </div>
                                          </div>
                                      </div>
                                      
                                      {order.orderStatus === 'preparing your cake' && (
                                          <Button 
                                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700" 
                                            onClick={() => handleMarkOutForDelivery(order._id)}
                                            disabled={markingId === order._id}
                                          >
                                            <Truck className="mr-2 h-4 w-4" />
                                            {markingId === order._id ? 'Sending...' : 'Send to Delivery Agent'}
                                          </Button>
                                      )}

                                      {order.orderStatus === 'Awaiting Agent' && (
                                          <div className="w-full mt-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-700 text-center font-medium">
                                            ⏳ Waiting for delivery agent to accept
                                          </div>
                                      )}
                                  </div>
                              </div>
                        </div>
                    </Card>
                ))
            )}
        </div>
      )}
      </main>
    </div>
  )
}

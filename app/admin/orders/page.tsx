/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingBag, CheckCircle, Clock, Truck, Store } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { Header } from "@/components/layout/header"
import { Input } from "@/components/ui/input"
import { VendorAssignment } from "@/components/admin/vendor-assignment"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})
  const { user, token } = useAuth()

  const toggleOrderDetails = (orderId: string) => {
      setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const fetchOrders = async () => {
    setLoading(true)
    const authToken = token || localStorage.getItem('token')

    if (!authToken) {
        setLoading(false)
        return
    }

    try {
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      const data = await res.json()
      if (data.success) {
        const sorted = data.orders.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted)
      } else {
        toast.error("Failed to fetch orders")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      fetchOrders()
    } else {
        setLoading(false)
    }
  }, [user, token])

  const handleVerifyOrder = async (orderId: string) => {
    setVerifyingId(orderId)
    const authToken = token || localStorage.getItem('token')

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: 'preparing your cake' })
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Order verified and moved to 'Preparing'")
        // Refresh orders
        fetchOrders()
      } else {
        toast.error(data.error || "Failed to verify order")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setVerifyingId(null)
    }
  }

  const handleRejectCancellation = async (orderId: string) => {
      const authToken = token || localStorage.getItem('token')
      try {
          const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ action: 'reject' })
          })

          const data = await res.json()

          if (data.success) {
              toast.success("Cancellation request rejected")
              fetchOrders()
          } else {
              toast.error(data.error || "Failed to reject")
          }
      } catch (error) {
          toast.error("Failed to reject request")
      }
  }

  // Filter orders based on status
  let filteredOrders = orders
  if (statusFilter === 'All') {
      filteredOrders = orders
  } else if (statusFilter === 'Punched') {
    filteredOrders = orders.filter(o => o.orderStatus === 'punched')
  } else if (statusFilter === 'Preparing') {
    filteredOrders = orders.filter(o => o.orderStatus === 'preparing your cake')
  } else if (statusFilter === 'Awaiting Agent') {
    filteredOrders = orders.filter(o => o.orderStatus === 'Awaiting Agent')
  } else if (statusFilter === 'Out for Delivery') {
    filteredOrders = orders.filter(o => o.orderStatus === 'Out for Delivery')
  } else if (statusFilter === 'Delivered') {
    filteredOrders = orders.filter(o => o.orderStatus === 'Delivered')
  } else if (statusFilter === 'Requests') {
      filteredOrders = orders.filter(o => o.cancellationRequest?.status === 'Pending')
  } else if (statusFilter === 'Cancelled') {
      filteredOrders = orders.filter(o => o.orderStatus === 'Cancelled')
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <p>Access Denied</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
        <Button onClick={fetchOrders} variant="outline" size="sm">Refresh</Button>
      </div>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
         <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Awaiting Verification</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'punched').length}</div>
                <p className="text-xs text-muted-foreground">Needs action</p>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'Delivered').length}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
         </Card>

         <Card
           className="border-none shadow-sm bg-amber-50 cursor-pointer hover:shadow-md transition-shadow col-span-full md:col-span-1"
           onClick={() => setStatusFilter('Awaiting Agent')}
         >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-800">Awaiting Agent</CardTitle>
                <Truck className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-amber-700">{orders.filter(o => o.orderStatus === 'Awaiting Agent').length}</div>
                <p className="text-xs text-amber-600">Waiting for delivery agent to accept</p>
            </CardContent>
         </Card>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="flex items-center gap-2 border-b pb-1 overflow-x-auto mb-6">
          {['Punched', 'Preparing', 'Awaiting Agent', 'Out for Delivery', 'Delivered', 'Requests', 'Cancelled', 'All'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    statusFilter === tab 
                    ? 'bg-white border-b-2 border-primary text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
              >
                  {tab === 'Requests' ? (
                      <span className="flex items-center gap-2">
                          Requests
                          {orders.filter(o => o.cancellationRequest?.status === 'Pending').length > 0 && (
                              <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                                  {orders.filter(o => o.cancellationRequest?.status === 'Pending').length}
                              </span>
                          )}
                      </span>
                  ) : tab === 'Awaiting Agent' ? (
                      <span className="flex items-center gap-2">
                          Awaiting Agent
                          {orders.filter(o => o.orderStatus === 'Awaiting Agent').length > 0 && (
                              <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                  {orders.filter(o => o.orderStatus === 'Awaiting Agent').length}
                              </span>
                          )}
                      </span>
                  ) : tab}
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
                    <Card key={order._id} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
                                          {order.cancellationRequest?.status === 'Pending' && (
                                              <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">
                                                  Cancellation Requested
                                              </Badge>
                                          )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                          Placed on {format(new Date(order.createdAt), "PPP 'at' p")}
                                      </p>
                                      {order.storeSnapshot?.name && (
                                          <p className="text-xs text-blue-700 flex items-center gap-1 mt-0.5">
                                              <Store className="h-3 w-3" />
                                              {order.storeSnapshot.name}
                                          </p>
                                      )}
                                  </div>

                                  {/* Customer Info */}
                                  <div className="flex items-center gap-4 text-sm">
                                      <div className="text-right">
                                          <p className="font-medium">{order.user?.name || order.shippingAddress.name}</p>
                                          <p className="text-muted-foreground">{order.user?.email}</p>
                                      </div>
                                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                          {(order.user?.name?.[0] || order.shippingAddress.name[0])?.toUpperCase()}
                                      </div>
                                  </div>
                              </div>
                                
                              {/* Cancellation Request Actions */}
                              {statusFilter === 'Requests' && order.cancellationRequest?.status === 'Pending' && (
                                  <div className="mt-4 p-4 bg-red-50/50 border border-red-100 rounded-lg">
                                      <h4 className="font-semibold text-red-800 mb-2">Cancellation Request</h4>
                                      <p className="text-sm text-gray-700 mb-4">
                                          <span className="font-medium">Reason:</span> "{order.cancellationRequest.reason}"
                                      </p>
                                      <div className="flex items-center gap-3">
                                          <RefundActionDialog order={order} onSuccess={fetchOrders} />
                                          <Button 
                                            variant="outline" 
                                            onClick={() => handleRejectCancellation(order._id)}
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                          >
                                              Reject Request
                                          </Button>
                                      </div>
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
                                                  <span className="font-medium">₹{item.price * item.quantity}</span>
                                              </div>
                                          ))}
                                      </div>
                                      <div className="pt-2 border-t flex justify-between items-center font-bold">
                                          <span>Total Amount</span>
                                          <span className="text-lg text-primary">₹{order.totalAmount}</span>
                                      </div>
                                  </div>
                                  
                                  {/* Actions / Details */}
                                  <div className="w-full md:w-64 space-y-3 border-l pl-0 md:pl-6 border-dashed">
                                      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Actions</div>
                                      <div className="text-sm space-y-1">
                                          <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                                          <p className="text-muted-foreground">{order.paymentMethod} • {order.paymentStatus}</p>
                                      </div>
                                      
                                      {order.orderStatus === 'punched' && (
                                          <Button 
                                            className="w-full mt-2 bg-green-600 hover:bg-green-700" 
                                            onClick={() => handleVerifyOrder(order._id)}
                                            disabled={verifyingId === order._id}
                                          >
                                            {verifyingId === order._id ? 'Verifying...' : 'Verify Order'}
                                          </Button>
                                      )}
                                      
                                      <Button 
                                          className="w-full mt-2" 
                                          variant="outline" 
                                          onClick={() => toggleOrderDetails(order._id)}
                                      >
                                          {expandedOrders[order._id] ? (
                                              <>Hide Details <ChevronUp className="ml-2 h-4 w-4" /></>
                                          ) : (
                                              <>View Full Details <ChevronDown className="ml-2 h-4 w-4" /></>
                                          )}
                                      </Button>
                                  </div>
                              </div>

                              {/* Expanded Order Details */}
                              {expandedOrders[order._id] && (
                                  <div className="mt-6 pt-6 border-t border-dashed space-y-6 animate-in slide-in-from-top-4 fade-in duration-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {/* Delivery Address */}
                                          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                              <h4 className="font-semibold text-sm flex items-center gap-2 text-gray-800">
                                                  <Truck className="h-4 w-4 text-blue-500" /> Shipping Details
                                              </h4>
                                              <p className="font-bold text-sm">{order.shippingAddress.name}</p>
                                              <p className="text-sm text-gray-600 leading-snug">
                                                  {order.shippingAddress.addressLine1}
                                                  {order.shippingAddress.addressLine2 && <><br />{order.shippingAddress.addressLine2}</>}
                                                  <br />{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                              </p>
                                              <p className="text-sm font-medium text-gray-800 pt-1">📞 {order.shippingAddress.phone}</p>
                                          </div>

                                          {/* Special Instructions */}
                                          {(order.occasion || order.cakeMessage || order.orderNotes) ? (
                                              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 space-y-3">
                                                  <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-900">
                                                      <ShoppingBag className="h-4 w-4 text-amber-500" /> Special Instructions
                                                  </h4>
                                                  {order.occasion && (
                                                    <div>
                                                      <p className="text-[10px] font-bold uppercase text-amber-700/70 mb-0.5">Occasion</p>
                                                      <div className="text-sm font-medium text-amber-900">
                                                        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 mr-2 border border-amber-200 text-xs">
                                                          {order.occasion}
                                                        </span>
                                                        {order.occasionName && <span>{order.occasionName}</span>}
                                                      </div>
                                                    </div>
                                                  )}
                                                  {order.cakeMessage && (
                                                    <div>
                                                      <p className="text-[10px] font-bold uppercase text-amber-700/70 mb-0.5">Cake Message</p>
                                                      <p className="text-sm font-medium italic text-amber-900">"{order.cakeMessage}"</p>
                                                    </div>
                                                  )}
                                                  {order.orderNotes && (
                                                    <div>
                                                      <p className="text-[10px] font-bold uppercase text-amber-700/70 mb-0.5">Notes</p>
                                                      <p className="text-sm text-amber-800/80 leading-snug">{order.orderNotes}</p>
                                                    </div>
                                                  )}
                                              </div>
                                          ) : (
                                              <div className="bg-gray-50/50 p-4 rounded-xl flex items-center justify-center text-sm text-muted-foreground border border-dashed border-gray-200">
                                                  No Special Instructions
                                              </div>
                                          )}

                                          {/* OTP & Actions */}
                                          <div className="space-y-4">
                                              {order.otp && ['punched', 'preparing your cake', 'Out for Delivery'].includes(order.orderStatus) && (
                                                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                      <h4 className="font-semibold text-sm flex items-center gap-2 text-purple-900 mb-2">
                                                          <span className="shrink-0 h-4 w-4 rounded-full bg-purple-200 flex items-center justify-center">🎯</span> Delivery OTP
                                                      </h4>
                                                      <div className="bg-white px-3 py-2 rounded-lg border-2 border-purple-200 text-center">
                                                          <span className="font-mono flex items-center justify-center text-xl font-bold tracking-[0.2em] text-purple-900">{order.otp}</span>
                                                      </div>
                                                      <p className="text-[10px] text-center text-purple-600 mt-1.5 font-medium">To be shared with vendor by customer</p>
                                                  </div>
                                              )}
                                              
                                              {/* Vendor Assignment */}
                                              <div className="bg-white p-4 rounded-xl border">
                                                  <h4 className="font-semibold text-sm mb-3">Vendor Assignment</h4>
                                                  <VendorAssignment 
                                                      orderId={order._id}
                                                      currentVendorId={order.vendor?._id}
                                                      currentVendorName={order.vendor?.name}
                                                      onAssigned={fetchOrders}
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}
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

function RefundActionDialog({ order, onSuccess }: { order: any, onSuccess: () => void }) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState(order.paymentMethod === 'COD' ? '0' : order.totalAmount.toString())
    const [walletAmount, setWalletAmount] = useState('0')
    const [processing, setProcessing] = useState(false)
    const { token } = useAuth()

    const handleApprove = async () => {
        setProcessing(true)
        try {
            const res = await fetch(`/api/admin/orders/${order._id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    action: 'approve',
                    refundAmount: parseFloat(amount) || 0,
                    walletRefundAmount: parseFloat(walletAmount) || 0
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Cancellation approved & refunded")
                setOpen(false)
                onSuccess()
            } else {
                toast.error(data.error || "Failed to approve")
            }
        } catch (error) {
            toast.error("Failed to approve")
        } finally {
            setProcessing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Approve & Refund
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve Cancellation</DialogTitle>
                    <DialogDescription>
                        Confirm refund amount. <br />
                        <span className="font-bold text-red-600">Note: Online payment will NOT be auto-refunded. You must refund manually via Razorpay Dashboard.</span><br />
                        Wallet amount (if any) will be refunded automatically.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {order.paymentMethod === 'COD' ? (
                         <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                             <p className="text-sm font-semibold text-yellow-800">COD Order</p>
                             <p className="text-xs text-yellow-700">No refund is applicable for COD orders. Order will be cancelled directly.</p>
                         </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Refund Amount (₹)</label>
                            <Input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                max={order.totalAmount}
                            />
                             <p className="text-xs text-muted-foreground">Max refundable: ₹{order.totalAmount}</p>
                        </div>
                    )}
                    
                    <div className="space-y-2 pt-2 border-t">
                        <label className="text-sm font-medium flex items-center gap-2">
                             Wallet Refund Amount (₹)
                             <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Credited to User Wallet</span>
                        </label>
                        <Input 
                            type="number" 
                            value={walletAmount}
                            onChange={(e) => setWalletAmount(e.target.value)}
                            placeholder="Amount to credit to wallet"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleApprove} disabled={processing || (!amount && !walletAmount)}>
                        {processing ? 'Processing...' : 'Confirm Refund'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

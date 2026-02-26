'use client';

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Phone, Calendar, MessageSquare, Package, Gift } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { AlertTriangle, Ban } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"

export default function UserOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (params.id && user) {
      // Get token from context or fallback to localStorage
      const authToken = token || localStorage.getItem('token')
      
      if (!authToken) {
        console.error('No auth token available')
        setLoading(false)
        return
      }

      fetch(`/api/orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrder(data.order)
          } else {
            console.error('Failed to fetch order:', data.error)
          }
        })
        .catch(err => console.error('Fetch error:', err))
        .finally(() => setLoading(false))
    } else if (!user) {
      setLoading(false)
    }
  }, [params.id, user, token])

  const handleCancelOrder = async () => {
      if (!cancelReason.trim()) {
          toast.error("Please provide a reason for cancellation")
          return
      }
      
      setCancelling(true)
      try {
          const res = await fetch(`/api/orders/${params.id}/cancel`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ reason: cancelReason })
          })
          
          const data = await res.json()
          
          if (data.success) {
              toast.success(data.message)
              setOrder(data.order) // Update local state
              setCancelOpen(false)
          } else {
              toast.error(data.error || "Failed to cancel order")
          }
      } catch (error) {
          toast.error("Failed to cancel order")
      } finally {
          setCancelling(false)
      }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardContent className="text-center p-8">
              <p className="mb-4">Please login to view order details.</p>
              <Link href="/">
                <Button>Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p>Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardContent className="text-center p-8">
              <p className="mb-4">Order not found</p>
              <Link href="/my-orders">
                <Button>Back to My Orders</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Order Details</h1>
        </div>

        <div className="grid gap-6">
          {/* Order Info Card */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-bold text-primary mb-1">ORDER #{order._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">Placed on {format(new Date(order.createdAt), "PPP p")}</p>
                </div>
                <Badge className={`${
                  order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                  order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                  order.orderStatus === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' :
                  order.orderStatus === 'preparing your cake' ? 'bg-purple-100 text-purple-700' :
                  order.orderStatus === 'punched' ? 'bg-blue-50 text-blue-600' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.orderStatus}
                </Badge>
              </div>

             {/* Cancellation Info */}
             {order.orderStatus === 'Cancelled' && (
                 <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                     <div className="flex items-start gap-3">
                         <Ban className="h-5 w-5 text-red-600 mt-0.5" />
                         <div>
                             <h4 className="font-semibold text-red-800">Order Cancelled</h4>
                             <p className="text-sm text-red-600 mt-1">
                                 Reason: {order.cancellationRequest?.reason}
                             </p>
                             {order.cancellationRequest?.refundAmount > 0 && (
                                 <p className="text-sm font-bold text-red-700 mt-2">
                                     Refund Amount: ₹{order.cancellationRequest?.refundAmount}
                                     <span className="font-normal text-xs ml-2 text-red-500">(Processed via Razorpay/Wallet)</span>
                                 </p>
                             )}
                         </div>
                     </div>
                 </div>
             )}

             {/* Cancellation Request Pending */}
             {order.cancellationRequest?.status === 'Pending' && order.orderStatus !== 'Cancelled' && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                     <div className="flex items-start gap-3">
                         <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                         <div>
                             <h4 className="font-semibold text-yellow-800">Cancellation Requested</h4>
                             <p className="text-sm text-yellow-700 mt-1">
                                 Your request to cancel this order is pending admin approval.
                             </p>
                             <p className="text-sm text-yellow-600 mt-1 italic">
                                 Reason: "{order.cancellationRequest?.reason}"
                             </p>
                         </div>
                     </div>
                 </div>
             )}

              {/* OTP Display */}
              {order.otp && ['punched', 'preparing your cake', 'Out for Delivery'].includes(order.orderStatus) && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-sm font-semibold text-purple-900 mb-1">Delivery Verification OTP:</p>
                  <p className="text-2xl font-mono font-bold text-purple-700 tracking-widest">{order.otp}</p>
                  <p className="text-xs text-purple-600 mt-2">Share this OTP with the delivery person to confirm delivery</p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order Items</h3>
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                    <div className="h-20 w-20 rounded-xl bg-gray-100 overflow-hidden relative shrink-0">
                      {item.image ? (
                        <img 
                            src={item.image.startsWith('http') ? item.image : `/api/uploads/${item.image}`} 
                            alt={item.name} 
                            className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-300">IMG</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity} • {item.weight}</p>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold ${order.orderStatus === 'Cancelled' ? 'text-gray-400 line-through' : ''}`}>
                            ₹{item.price * item.quantity}
                        </p>
                    </div>
                  </div>
                ))}

                {order.addons && order.addons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed">
                        <h4 className="text-xs font-bold uppercase text-pink-500 tracking-wider mb-3 flex items-center gap-1"><Gift className="h-4 w-4 text-pink-500" /> Add-ons</h4>
                        <div className="space-y-3">
                            {order.addons.map((addon: any, idx: number) => (
                                <div key={idx} className="flex gap-4 items-center">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-pink-700">{addon.name}</h4>
                                        <p className="text-sm text-pink-600/70">Qty: {addon.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-pink-700 ${order.orderStatus === 'Cancelled' ? 'text-pink-300 line-through' : ''}`}>
                                            ₹{addon.price * addon.quantity}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">- ₹{order.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Charge</span>
                  <span>₹{order.deliveryCharge}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total Amount</span>
                  <span className={`text-primary ${order.orderStatus === 'Cancelled' ? 'line-through text-gray-400' : ''}`}>₹{order.totalAmount}</span>
                </div>
                
                <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg flex items-start gap-2 mt-4">
                    <span className="font-bold shrink-0">Note:</span>
                    <p>Returns/Refunds are not available after delivery. Please check your order upon receipt.</p>
                </div>

                {/* Cancel Button */}
                {!['Cancelled', 'Delivered', 'Out for Delivery'].includes(order.orderStatus) && !order.cancellationRequest?.status && (
                    <div className="pt-4 mt-4 border-t">
                        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none">
                                    Cancel Order
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Cancel Order</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to cancel this order? 
                                        A cancellation request will be sent to the admin for approval.
                                        Once approved, your refund will be processed.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Reason for cancellation</label>
                                        <Textarea 
                                            placeholder="Please tell us why you want to cancel..."
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setCancelOpen(false)}>Close</Button>
                                    <Button variant="destructive" onClick={handleCancelOrder} disabled={cancelling}>
                                        {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details Card */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Address
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-base">{order.shippingAddress.name}</p>
                <p className="text-muted-foreground">{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p className="text-muted-foreground">{order.shippingAddress.addressLine2}</p>}
                <p className="text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <div className="flex items-center gap-2 pt-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.shippingAddress.phone}</span>
                </div>
                {order.deliveryDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Delivery: {format(new Date(order.deliveryDate), "PPP")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions Card */}
          {(order.occasion || order.cakeMessage || order.orderNotes) && (
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Special Instructions
                </h3>
                <div className="space-y-3">
                  {order.occasion && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                          {order.occasion === 'Birthday' ? 'Occasion & Whose Birthday?' : 
                           order.occasion === 'Anniversary' ? 'Occasion & Whose Anniversary?' : 
                           order.occasion === 'Celebration' ? 'Occasion & Type' : 
                           'Occasion Details'}
                      </p>
                      <div className="font-medium">
                        <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-xs mr-2 border border-purple-200">
                          {order.occasion}
                        </span>
                        {order.occasionName && (
                          <span className="text-foreground">{order.occasionName}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {order.cakeMessage && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Cake Message</p>
                      <p className="font-medium italic">"{order.cakeMessage}"</p>
                    </div>
                  )}
                  {order.orderNotes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Order Notes</p>
                      <p className="text-sm text-muted-foreground">{order.orderNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info Card */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Payment Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

'use client';

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Truck, CheckCircle, Package, CreditCard, Store, Clock, Gift } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { VendorAssignment } from "@/components/admin/vendor-assignment"

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchOrder = async () => {
      try {
          const res = await fetch(`/api/orders/${params.id}`)
          const data = await res.json()
          if (data.success) {
              setOrder(data.order)
          } else {
              toast.error(data.error || "Failed to fetch order")
          }
      } catch (error) {
          toast.error("Error fetching order")
      } finally {
          setLoading(false)
      }
  }

  useEffect(() => {
      if (params.id) fetchOrder()
  }, [params.id])

  const handleUpdateStatus = async (status: string, action?: string) => {
      setUpdating(true)
      try {
          const res = await fetch(`/api/orders/${params.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status, action })
          })
          const data = await res.json()
          
          if (data.success) {
              toast.success("Order updated successfully")
              fetchOrder() // Refresh data
          } else {
              toast.error(data.error || "Failed to update order")
          }
      } catch (error) {
          toast.error("Something went wrong")
      } finally {
          setUpdating(false)
      }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading order details...</div>
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
              <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                          <CardTitle>Order #{order._id.slice(-6).toUpperCase()}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                              Placed on {format(new Date(order.createdAt), "PPP p")}
                          </p>
                          {/* Estimated delivery based on preparingTime */}
                          {order.storeSnapshot?.name && (
                              <p className="text-xs text-blue-700 mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Store: <strong>{order.storeSnapshot.name}</strong></span>
                              </p>
                          )}
                      </div>
                      <Badge className="text-sm px-3 py-1" variant={
                          order.orderStatus === 'Delivered' ? 'default' : 'secondary'
                      }>
                          {order.orderStatus}
                      </Badge>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-6">
                          {/* Items */}
                          <div className="space-y-4">
                              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Items</h3>
                              {order.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                      <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden relative">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-300">IMG</div>
                                            )}
                                      </div>
                                      <div className="flex-1">
                                          <p className="font-medium">{item.name}</p>
                                          <p className="text-sm text-muted-foreground">{item.weight} • Qty: {item.quantity}</p>
                                      </div>
                                      <p className="font-bold">₹{item.price * item.quantity}</p>
                                  </div>
                              ))}
                          </div>

                          {order.addons && order.addons.length > 0 && (
                              <>
                                  <Separator className="my-4" />
                                  <div className="space-y-4">
                                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Gift className="h-4 w-4 text-pink-500" /> Add-ons</h3>
                                      {order.addons.map((addon: any, idx: number) => (
                                          <div key={idx} className="flex gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                              <div className="flex-1">
                                                  <p className="font-medium text-pink-700">{addon.name}</p>
                                                  <p className="text-sm text-pink-600/70">Qty: {addon.quantity}</p>
                                              </div>
                                              <p className="font-bold text-pink-700">₹{addon.price * addon.quantity}</p>
                                          </div>
                                      ))}
                                  </div>
                              </>
                          )}

                          <Separator />

                          {/* Payment & Total */}
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Payment Info</h3>
                                  <p className="font-medium">{order.paymentMethod}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>
                                          {order.paymentStatus}
                                      </Badge>
                                      {order.paymentDetails?.razorpay_payment_id && (
                                          <span className="text-xs text-muted-foreground font-mono">
                                              ID: {order.paymentDetails.razorpay_payment_id}
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="text-right space-y-1">
                                  <div className="flex gap-8 justify-between text-sm">
                                      <span className="text-muted-foreground">Subtotal</span>
                                      <span>₹{order.subtotal}</span>
                                  </div>
                                  <div className="flex gap-8 justify-between text-sm">
                                      <span className="text-muted-foreground">Discount</span>
                                      <span className="text-green-600">- ₹{order.discount}</span>
                                  </div>
                                  <div className="flex gap-8 justify-between text-sm">
                                      <span className="text-muted-foreground">Delivery</span>
                                      <span>₹{order.deliveryCharge}</span>
                                  </div>
                                  <div className="flex gap-8 justify-between font-bold text-lg pt-2 border-t mt-2">
                                      <span>Total</span>
                                      <span className="text-primary">₹{order.totalAmount}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card className="border-none shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                          <Truck className="h-4 w-4" /> Shipping Details
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                      <p className="font-bold text-base">{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.addressLine1}</p>
                      {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                      <p className="mt-2 text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
                  </CardContent>
              </Card>

              {/* Special Instructions */}
              {(order.occasion || order.cakeMessage || order.orderNotes) && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" /> Special Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
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
                        <p className="text-muted-foreground">{order.orderNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
              <Card className="border-none shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      {order.paymentStatus !== 'Paid' && (
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700" 
                            onClick={() => handleUpdateStatus(order.orderStatus, 'verify_payment')}
                            disabled={updating}
                          >
                              <CheckCircle className="mr-2 h-4 w-4" /> Verify Payment
                          </Button>
                      )}
                      
                      {order.orderStatus !== 'Out for Delivery' && order.orderStatus !== 'Delivered' && (
                          <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => handleUpdateStatus('Out for Delivery')}
                            disabled={updating}
                          >
                              <Truck className="mr-2 h-4 w-4" /> Mark "Out for Delivery"
                          </Button>
                      )}

                      {order.orderStatus !== 'Delivered' && (
                          <Button 
                            className="w-full" 
                            onClick={() => handleUpdateStatus('Delivered')}
                            disabled={updating}
                          >
                              <Package className="mr-2 h-4 w-4" /> Mark "Delivered"
                          </Button>
                      )}
                  </CardContent>
              </Card>

               <Card className="border-none shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-base">User Info</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                      <p className="font-medium">{order.user?.name || "Guest User"}</p>
                      <p className="text-muted-foreground">{order.user?.email}</p>
                      <p className="text-muted-foreground">{order.user?.phone}</p>
                  </CardContent>
               </Card>

               {/* Store Info Card */}
               {order.storeSnapshot?.name && (
                   <Card className="border-none shadow-sm bg-blue-50/40">
                       <CardHeader>
                           <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                               <Store className="h-4 w-4" /> Store Info
                           </CardTitle>
                       </CardHeader>
                       <CardContent className="text-sm space-y-1">
                           <p className="font-semibold text-blue-900">{order.storeSnapshot.name}</p>
                           <p className="text-muted-foreground">{order.storeSnapshot.address}</p>
                           {order.storeSnapshot.phone && (
                               <p className="text-muted-foreground">📞 {order.storeSnapshot.phone}</p>
                           )}
                       </CardContent>
                   </Card>
               )}

              {/* Delivery OTP Card */}
              {order.otp && ['punched', 'preparing your cake', 'Out for Delivery'].includes(order.orderStatus) && (
                  <Card className="border-none shadow-sm bg-purple-50 border-purple-200">
                      <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2 text-purple-900">
                              <Package className="h-4 w-4" /> Delivery OTP
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="text-center space-y-2">
                              <p className="text-xs text-purple-700 mb-2">Share this OTP with vendor for delivery verification</p>
                              <div className="bg-white px-4 py-3 rounded-lg border-2 border-purple-300">
                                  <span className="font-mono text-2xl font-bold tracking-widest text-purple-900">{order.otp}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">User will provide this OTP to vendor at delivery</p>
                          </div>
                      </CardContent>
                  </Card>
              )}

              <Card className="border-none shadow-sm">
                  <CardHeader>
                      <CardTitle className="text-base">Vendor Assignment</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <VendorAssignment 
                        orderId={order._id}
                        currentVendorId={order.vendor?._id}
                        currentVendorName={order.vendor?.name}
                        onAssigned={fetchOrder}
                      />
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  )
}

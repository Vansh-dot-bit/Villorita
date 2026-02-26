'use client';

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Package, ChevronRight, ShoppingBag, XCircle, Clock, Gift } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// Order Card Component with State for Dialog
function OrderCard({ order, isCancelled = false, onCancelSuccess }: { order: any, isCancelled?: boolean, onCancelSuccess: () => void }) {
    const { token } = useAuth();
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const handleCancelOrder = async () => {
        if (!cancelReason.trim()) {
            toast.error("Please provide a reason for cancellation")
            return
        }
        
        setCancelling(true)
        try {
            const res = await fetch(`/api/orders/${order._id}/cancel`, {
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
                setCancelOpen(false)
                onCancelSuccess(); // Refresh orders
            } else {
                toast.error(data.error || "Failed to cancel order")
            }
        } catch (error) {
            toast.error("Failed to cancel order")
        } finally {
            setCancelling(false)
        }
    }

    return (
    <Card className={`border-none shadow-sm overflow-hidden hover:shadow-md transition-all ${isCancelled ? 'bg-red-50/30 opacity-90' : 'bg-white'}`}>
        <div className={`p-6 ${isCancelled ? 'bg-red-50/10' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b pb-4">
                <div>
                    <p className="text-sm font-bold text-primary">ORDER #{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">Placed on {format(new Date(order.createdAt), "PPP p")}</p>
                    {order.otp && ['punched', 'preparing your cake', 'Out for Delivery'].includes(order.orderStatus) && (
                        <div className="mt-2 text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-md inline-block border border-purple-100">
                            <span className="font-semibold">OTP for Delivery: </span> 
                            <span className="font-mono text-lg tracking-widest font-bold ml-1">{order.otp}</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.orderStatus === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' :
                        order.orderStatus === 'preparing your cake' ? 'bg-purple-100 text-purple-700' :
                        order.orderStatus === 'punched' ? 'bg-blue-50 text-blue-600' :
                        order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {order.orderStatus.toUpperCase()}
                    </span>
                    {order.cancellationRequest?.status === 'Pending' && order.orderStatus !== 'Cancelled' && (
                        <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200 uppercase tracking-wide">
                            Cancellation Requested
                        </span>
                    )}
                </div>
            </div>
            
            <div className={`space-y-4 ${isCancelled ? 'opacity-60' : ''}`}>
                {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center">
                        <div className="h-16 w-16 rounded-xl bg-gray-100 overflow-hidden relative shrink-0">
                            {item.image ? (
                                <img 
                                    src={item.image.startsWith('http') ? item.image : `/api/uploads/${item.image}`} 
                                    alt={item.name} 
                                    className={`h-full w-full object-cover ${isCancelled ? 'grayscale' : ''}`} 
                                />
                                ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-300">IMG</div>
                                )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} • {item.weight}</p>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold ${isCancelled ? 'line-through text-gray-400' : ''}`}>₹{item.price * item.quantity}</p>
                        </div>
                    </div>
                ))}
            </div>

            {order.addons && order.addons.length > 0 && (
                <div className={`space-y-3 mt-4 pt-4 border-t border-dashed ${isCancelled ? 'opacity-60' : ''}`}>
                    <div className="text-xs font-bold uppercase text-pink-500 tracking-wider flex items-center gap-1"><Gift className="h-3 w-3" /> Add-ons</div>
                    {order.addons.map((addon: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-pink-700">{addon.name} <span className="text-pink-500 font-medium">x{addon.quantity}</span></span>
                            <span className={`font-bold text-pink-700 ${isCancelled ? 'line-through text-pink-300' : ''}`}>₹{addon.price * addon.quantity}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className={`mt-6 flex items-center justify-between border-t pt-4 -mx-6 -mb-6 p-6 ${isCancelled ? 'bg-red-50' : 'bg-gray-50/50'}`}>
                <div className="text-sm flex flex-col gap-1">
                    {isCancelled ? (
                         <>
                            <div>
                                <span className="text-muted-foreground">Refund Status: </span>
                                <span className="font-bold text-red-600">
                                {order.cancellationRequest?.status === 'Approved' ? 'Processed' : 'Pending'}
                                </span>
                            </div>
                         </>
                    ) : (
                         <>
                            <div>
                                <span className="text-muted-foreground">Total Amount: </span>
                                <span className="font-bold text-lg text-primary">₹{order.totalAmount}</span>
                            </div>
                         </>
                    )}
                </div>
                
                <div className="flex gap-2">
                    {/* Integrated Cancel Button */}
                    {!isCancelled && ['punched', 'preparing your cake'].includes(order.orderStatus) && !order.cancellationRequest?.status && (
                        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3">
                                    Cancel
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
                    )}

                    <Link href={`/my-orders/${order._id}`}>
                        <Button variant="outline" className={`rounded-xl ${isCancelled ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-primary text-primary hover:bg-primary/5'}`}>
                            View Details <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    </Card>
    );
}

export default function MyOrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    if (user) {
        const authToken = token || localStorage.getItem('token')
        
        if (!authToken) {
            setLoading(false)
            return
        }

        setLoading(true);
        fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setOrders(data.orders);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    } else {
        setLoading(false)
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, token]);

  if (!user) {
      return (
          <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
              <Header />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm">
                    <p className="mb-4">Please login to view your orders.</p>
                    <Link href="/">
                        <Button>Go Home</Button>
                    </Link>
                </div>
              </div>
          </div>
      )
  }

  const activeOrders = orders.filter(o => o.orderStatus !== 'Cancelled');
  const cancelledOrders = orders.filter(o => o.orderStatus === 'Cancelled');

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
         <div className="flex items-center gap-4 mb-6">
            <Link href="/profile">
                <Button variant="ghost" size="sm">Back</Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6" /> My Orders
            </h1>
         </div>

         {loading ? (
             <div className="text-center py-12">Loading orders...</div>
         ) : orders.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
                 <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                 <h2 className="text-xl font-bold text-gray-400 mb-4">No orders found</h2>
                 <Link href="/">
                    <Button>Craving? Order Now</Button>
                 </Link>
             </div>
         ) : (
             <Tabs defaultValue="active" className="space-y-6">
                <TabsList className="bg-white p-1 rounded-xl shadow-sm border">
                    <TabsTrigger value="active" className="rounded-lg px-6 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                        <Clock className="w-4 h-4 mr-2" />
                        Active Orders ({activeOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="rounded-lg px-6 data-[state=active]:bg-red-100 data-[state=active]:text-red-700">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelled ({cancelledOrders.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                     {activeOrders.length > 0 ? (
                         activeOrders.map(order => (
                             <OrderCard key={order._id} order={order} onCancelSuccess={fetchOrders} />
                         ))
                     ) : (
                         <div className="text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">
                             No active orders
                         </div>
                     )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-4">
                     {cancelledOrders.length > 0 ? (
                         cancelledOrders.map(order => (
                             <OrderCard key={order._id} order={order} isCancelled={true} onCancelSuccess={fetchOrders} />
                         ))
                     ) : (
                         <div className="text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">
                             No cancelled orders
                         </div>
                     )}
                </TabsContent>
             </Tabs>
         )}
      </main>
    </div>
  )
}

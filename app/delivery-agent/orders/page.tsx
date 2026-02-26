/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  Gift,
  Mail,
  RefreshCw,
  Clock,
  AlertCircle,
  Store,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

type Order = {
  _id: string;
  orderStatus: string;
  createdAt: string;
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    pincode: string;
  };
  items: { name: string; quantity: number; weight?: string }[];
  totalAmount: number;
  occasion?: string;
  occasionName?: string;
  cakeMessage?: string;
  user?: { name: string; email: string; phone?: string };
  otp?: string;
  storeId?: {
    _id: string;
    name: string;
    address: string;
    vendorId?: { name: string; phone?: string };
  };
  addons?: { name: string; quantity: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  'Awaiting Agent': 'bg-amber-100 text-amber-700',
  'Out for Delivery': 'bg-blue-100 text-blue-700',
  'Delivered': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700',
};

export default function DeliveryAgentOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'Pending' | 'Active' | 'Delivered' | 'All'>('Pending');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // OTP Dialog
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const { token } = useAuth();

  const fetchOrders = useCallback(async () => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/delivery-agent/orders', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders.sort((a: Order, b: Order) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        toast.error(data.error || 'Failed to fetch orders');
      }
    } catch {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAccept = async (orderId: string) => {
    setAcceptingId(orderId);
    const authToken = token || localStorage.getItem('token');
    try {
      const res = await fetch(`/api/delivery-agent/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: 'accept' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Delivery accepted! Order is now Out for Delivery.');
        fetchOrders();
      } else {
        toast.error(data.error || 'Failed to accept delivery');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedOrderId || otpInput.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    const authToken = token || localStorage.getItem('token');
    try {
      const res = await fetch(`/api/delivery-agent/orders/${selectedOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ action: 'verify_otp', otp: otpInput }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order verified and marked as Delivered! 🎉');
        setOtpDialogOpen(false);
        setOtpInput('');
        setSelectedOrderId(null);
        fetchOrders();
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const openOtpDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setOtpInput('');
    setOtpDialogOpen(true);
  };

  const filteredOrders = orders.filter(o => {
    if (tab === 'Pending') return o.orderStatus === 'Awaiting Agent';
    if (tab === 'Active') return o.orderStatus === 'Out for Delivery';
    if (tab === 'Delivered') return o.orderStatus === 'Delivered';
    return true;
  });

  const pendingCount = orders.filter(o => o.orderStatus === 'Awaiting Agent').length;
  const activeCount = orders.filter(o => o.orderStatus === 'Out for Delivery').length;

  const tabs = ['Pending', 'Active', 'Delivered', 'All'] as const;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-500" />
            My Deliveries
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Accept deliveries and verify OTPs to complete orders
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-amber-500" />
          <div>
            <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-xs text-amber-600">Awaiting Pickup</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Truck className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-xl font-bold text-blue-700">{activeCount}</p>
            <p className="text-xs text-blue-600">Out for Delivery</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-xl font-bold text-green-700">
              {orders.filter(o => o.orderStatus === 'Delivered').length}
            </p>
            <p className="text-xs text-green-600">Delivered Total</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b pb-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              tab === t
                ? 'bg-white border-b-2 border-orange-500 text-orange-600'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
            }`}
          >
            {t}
            {t === 'Pending' && pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
            {t === 'Active' && activeCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {activeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600">No orders in "{tab}"</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'Pending' ? 'No deliveries waiting for pickup yet.' : 'Nothing here yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map(order => (
            <Card key={order._id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-0">
                {/* Status stripe */}
                <div className={`h-1 w-full ${
                  order.orderStatus === 'Awaiting Agent' ? 'bg-amber-400' :
                  order.orderStatus === 'Out for Delivery' ? 'bg-blue-400' :
                  order.orderStatus === 'Delivered' ? 'bg-green-400' : 'bg-gray-300'
                }`} />
                
                <div className="p-5">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-800">
                        #{order._id.toString().slice(-6).toUpperCase()}
                      </span>
                      <Badge className={`${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'} border-0 text-xs font-semibold`}>
                        {order.orderStatus === 'Awaiting Agent' ? '⏳ Awaiting Pickup' :
                         order.orderStatus === 'Out for Delivery' ? '🚚 Out for Delivery' :
                         order.orderStatus === 'Delivered' ? '✅ Delivered' :
                         order.orderStatus}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">₹{order.totalAmount?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), 'dd MMM, p')}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Left: Items + Occasion */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Order Items</p>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="font-semibold text-orange-500">{item.quantity}x</span>
                              <span className="text-gray-700">{item.name}</span>
                              {item.weight && <span className="text-xs text-muted-foreground">({item.weight})</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.addons && order.addons.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold uppercase text-pink-500 tracking-wider mb-1 flex items-center gap-1"><Gift className="h-3 w-3" /> Add-ons</p>
                          {order.addons.map((addon: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-pink-500">{addon.quantity}x</span>
                                <span className="text-pink-700">{addon.name}</span>
                              </div>
                          ))}
                        </div>
                      )}

                      {(order.occasion || order.cakeMessage) && (
                        <div className="space-y-1.5 pt-2 border-t border-dashed">
                          {order.occasion && (
                            <div className="flex items-center gap-2 text-sm">
                              <Gift className="h-3.5 w-3.5 text-purple-500" />
                              <span className="text-gray-600">{order.occasion}
                                {order.occasionName && ` (${order.occasionName})`}
                              </span>
                            </div>
                          )}
                          {order.cakeMessage && (
                            <div className="flex items-start gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-pink-500 mt-0.5" />
                              <span className="italic text-gray-500">"{order.cakeMessage}"</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Delivery address + Actions */}
                    <div className="space-y-4">
                      {/* Pickup Information */}
                      {order.storeId && (
                        <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                          <p className="text-[10px] font-bold uppercase text-orange-700/80 tracking-wider mb-2 flex items-center gap-1">
                            <Store className="h-3 w-3" /> Pickup Location
                          </p>
                          <div className="space-y-1.5">
                            <div>
                              <p className="font-semibold text-orange-950 text-sm">{order.storeId.name}</p>
                              <p className="text-xs text-orange-800 leading-snug break-words pr-2">{order.storeId.address}</p>
                            </div>
                            {order.storeId.vendorId && (
                              <div className="flex items-center gap-3 text-xs text-orange-700/80 pt-1 border-t border-orange-100 mt-1.5">
                                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {order.storeId.vendorId.name}</span>
                                {order.storeId.vendorId.phone && (
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {order.storeId.vendorId.phone}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Deliver To */}
                      <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Deliver To
                        </p>
                        <div className="space-y-1.5">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{order.shippingAddress?.name}</p>
                            <p className="text-xs text-gray-600 leading-snug mt-0.5">
                              {order.shippingAddress?.addressLine1}
                              {order.shippingAddress?.addressLine2 && <><br/>{order.shippingAddress.addressLine2}</>}
                              <br/>{order.shippingAddress?.city} - {order.shippingAddress?.pincode}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 pt-1 border-t border-gray-100 mt-1.5">
                            <Phone className="h-3 w-3" />
                            <span className="font-medium">{order.shippingAddress?.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {order.orderStatus === 'Awaiting Agent' && (
                        <Button
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
                          onClick={() => handleAccept(order._id)}
                          disabled={acceptingId === order._id}
                        >
                          <Truck className="h-4 w-4" />
                          {acceptingId === order._id ? 'Accepting...' : 'Accept Delivery'}
                        </Button>
                      )}

                      {order.orderStatus === 'Out for Delivery' && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                          onClick={() => openOtpDialog(order._id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Verify OTP & Complete
                        </Button>
                      )}

                      {order.orderStatus === 'Delivered' && (
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Delivered Successfully
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Verify Delivery OTP
            </DialogTitle>
            <DialogDescription>
              Ask the customer for their 6-digit OTP shown in their order details.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="text-center text-2xl tracking-[0.5em] font-bold h-14"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              {otpInput.length}/6 digits entered
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setOtpDialogOpen(false); setOtpInput(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || otpInput.length !== 6}
              className="bg-green-600 hover:bg-green-700"
            >
              {verifyingOtp ? 'Verifying...' : '✓ Confirm Delivery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

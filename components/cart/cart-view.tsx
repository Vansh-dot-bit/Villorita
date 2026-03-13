"use client"

import { useState, useEffect, useMemo } from "react"
import { MapPin, Gift, Tag, ChevronDown, Trash2, ShoppingBag, Wallet, Truck, Info, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Textarea } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem 
} from "@/components/ui/dropdown-menu"
import { useCart } from "@/context/cart-context"
import { useLocation } from "@/context/location-context"
import { useAuth } from "@/context/auth-context"
import { useGps } from "@/context/gps-context"
import { getDistanceKm } from "@/lib/haversine"
import { useRouter } from "next/navigation"

import { verifyCoupon } from "@/app/actions/coupon"
import { toast } from "sonner" 
import { AuthModal } from "@/components/auth/auth-modal"

export function CartView() {
  const { items, cartTotal, removeFromCart, addons, addAddonToCart, removeAddonFromCart, addonTotal } = useCart()
  const { selectedLocation } = useLocation()
  const { user, token } = useAuth()
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
  const isLoggedIn = !!token
  const [occasion, setOccasion] = useState("Birthday")
  const [occasionName, setOccasionName] = useState("") // Name for birthday/anniversary
  const [cakeMessage, setCakeMessage] = useState("") // Message on cake
  
  // Addons State
  const [availableAddons, setAvailableAddons] = useState<any[]>([])
  const [selectedAddonId, setSelectedAddonId] = useState("")
  const [addonQuantity, setAddonQuantity] = useState(1)

  // ── Admin Delivery Settings ────────────────────────────────────────────────
  // ── Admin Delivery Settings ────────────────────────────────────────────────
  const { userLat, userLng, isLocationServiceable, resolvedAddress, permissionStatus, requestLocation, setManualPromptOpen } = useGps()
  const [deliverySettings, setDeliverySettings] = useState<any>(null)
  const [activeFees, setActiveFees] = useState<any[]>([])
  const [storeLat, setStoreLat] = useState<number | null>(null)
  const [storeLng, setStoreLng] = useState<number | null>(null)

  useEffect(() => {
    // Fetch delivery settings and custom fees
    Promise.all([
        fetch('/api/admin/delivery-settings').then(r => r.json()),
        fetch('/api/admin/fees').then(r => r.json()),
        fetch('/api/addons').then(r => r.json())
    ]).then(([d, f, a]) => {
        if (d.success) setDeliverySettings(d.settings);
        if (f.success) setActiveFees(f.fees.filter((fee: any) => fee.isActive));
        if (a.success) setAvailableAddons(a.addons.filter((addon: any) => addon.isActive));
    }).catch(() => {})
  }, [])

  // Resolve store lat/lng from first cart item's product storeId
  useEffect(() => {
    const fetchStoreCoords = async () => {
      for (const item of items) {
        const storeId = (item as any).storeId
        if (storeId) {
          try {
            const res = await fetch(`/api/stores/${storeId}`)
            const data = await res.json()
            if (data.success && data.store?.lat != null && data.store?.lng != null) {
              setStoreLat(data.store.lat)
              setStoreLng(data.store.lng)
            }
          } catch (_) {}
          break
        }
      }
    }
    if (items.length > 0) fetchStoreCoords()
  }, [items])

  // Compute real GPS distance (km) between user and store
  const storeKm = useMemo(() => {
    if (userLat != null && userLng != null && storeLat != null && storeLng != null) {
      return getDistanceKm(userLat, userLng, storeLat, storeLng)
    }
    return 0
  }, [userLat, userLng, storeLat, storeLng])

  // Compute delivery charge from admin settings
  const computeDeliveryCharge = (settings: any, km: number) => {
    if (!settings || !settings.isActive) return 0
    const base = settings.baseFee ?? 0
    const perKm = (settings.perKmCharge ?? 0) * km
    const surge = settings.highDemandSurcharge ?? 0
    const extra = settings.extraFee ?? 0
    return Math.round(base + perKm + surge + extra)
  }

  const getDeliveryBreakdown = (settings: any, km: number) => {
    if (!settings || !settings.isActive) return []
    const rows: { label: string; amount: number }[] = []
    
    if (settings.baseFee > 0) rows.push({ label: 'Base Delivery Fee', amount: settings.baseFee })
    
    const roundedKm = Math.round(km * 10) / 10
    const perKmAmt = Math.round((settings.perKmCharge ?? 0) * km)
    if (perKmAmt > 0) rows.push({ label: `Distance (${roundedKm} km × ₹${settings.perKmCharge}/km)`, amount: perKmAmt })
    if (settings.highDemandSurcharge > 0) rows.push({ label: 'High Demand Surcharge', amount: settings.highDemandSurcharge })
    if (settings.extraFee > 0) rows.push({ label: settings.extraFeeLabel || 'Extra Fee', amount: settings.extraFee })
    return rows
  }
  // ──────────────────────────────────────────────────────────────────────────
  
  // Address State
  const [addressDetails, setAddressDetails] = useState({
      name: user?.name || "",
      phone: user?.phone || "",
      house: "",
      city: "",
      pincode: ""
  })
  
  // Update address when user loads (if initially null)
  useState(() => {
      if (user) {
          setAddressDetails(prev => ({
              ...prev,
              name: prev.name || user.name || "",
              phone: prev.phone || user.phone || ""
          }))
      }
  })

  // Auto-fill City if resolvedAddress changes and city is empty
  useEffect(() => {
      if (resolvedAddress && !addressDetails.city) {
          // resolvedAddress often has format "Specific Area, City". Try to extract City
          const parts = resolvedAddress.split(',');
          const cityPart = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
          setAddressDetails(prev => ({ ...prev, city: cityPart }));
      }
  }, [resolvedAddress]);

  const [couponInput, setCouponInput] = useState("")
  const [loadingCoupon, setLoadingCoupon] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number, walletCashback?: number, type?: string } | null>(null)
  
  // Wallet State
  const [useWallet, setUseWallet] = useState(false)
  const walletBalance = user?.walletBalance || 0
  
  // Dynamic calculation
  const deliveryCharge = computeDeliveryCharge(deliverySettings, storeKm)
  const deliveryBreakdown = getDeliveryBreakdown(deliverySettings, storeKm)
  const discount = 0 
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0
  const walletCashback = appliedCoupon?.walletCashback || 0
  
  // ── Compute Custom Taxes & Charges ──
  const computedDetails = useMemo(() => {
     let totalCharges = 0;
     let totalTaxes = 0;
     const appliedChargesList: { name: string, amount: number, description: string }[] = [];
     const appliedTaxesList: { name: string, amount: number, description: string }[] = [];

     activeFees.forEach(fee => {
         if (fee.type === 'charge') {
             totalCharges += fee.value;
             appliedChargesList.push({ name: fee.name, amount: fee.value, description: fee.description });
         } else if (fee.type === 'tax') {
             // Calculate base value based on applicableOn components
             let taxBaseValue = 0;
             if (fee.applicableOn.includes('subtotal')) taxBaseValue += cartTotal;
             if (fee.applicableOn.includes('delivery')) taxBaseValue += deliveryCharge;
             if (fee.applicableOn.includes('addons')) taxBaseValue += addonTotal;
             
             // Deduct coupon discount proportionally (assuming discount applies to subtotal + addons mainly)
             // Simple approximation: if discount exists, subtract it from the total taxBaseValue if it exceeds it.
             const effectiveDiscount = discount + couponDiscount;
             const effectiveTaxBase = Math.max(0, taxBaseValue - effectiveDiscount);

             const taxAmount = Math.round((effectiveTaxBase * fee.value) / 100);
             if (taxAmount > 0) {
                 totalTaxes += taxAmount;
                 appliedTaxesList.push({ name: `${fee.name} (${fee.value}%)`, amount: taxAmount, description: fee.description });
             }
         }
     });

     return { totalCharges, totalTaxes, appliedChargesList, appliedTaxesList };
  }, [activeFees, cartTotal, addonTotal, deliveryCharge]);

  // Calculate wallet deduction (wallet cashback doesn't reduce cart price)
  const subtotalAfterDiscount = Math.round(cartTotal + addonTotal + deliveryCharge + computedDetails.totalCharges + computedDetails.totalTaxes - discount - couponDiscount)
  const walletDeduction = useWallet ? Math.round(Math.min(walletBalance, subtotalAfterDiscount)) : 0
  const finalPrice = Math.max(0, subtotalAfterDiscount - walletDeduction)

  const handleApplyCoupon = async (codeArg?: any) => {
      setLoadingCoupon(true)
      setCouponError("")
      
      const codeToVerify = typeof codeArg === 'string' ? codeArg : couponInput;
      const result = await verifyCoupon(codeToVerify, cartTotal, addonTotal, user?.id)
      
      if (result.success) {
          setAppliedCoupon({ 
              code: result.code!, 
              discount: result.discount!, 
              walletCashback: result.walletCashback || 0,
              type: result.type || 'discount'
          })
          toast.success(result.message)
      } else {
          setCouponError(result.message || "Invalid coupon")
          toast.error(result.message)
      }
      setLoadingCoupon(false)
  }

  // Auto-recalculate coupon if totals change
  useEffect(() => {
    if (appliedCoupon) {
      verifyCoupon(appliedCoupon.code, cartTotal, addonTotal, user?.id).then(result => {
        if (result.success) {
          setAppliedCoupon({ 
              code: result.code!, 
              discount: result.discount!, 
              walletCashback: result.walletCashback || 0,
              type: result.type || 'discount'
          })
        } else {
          setAppliedCoupon(null)
          setCouponInput("")
          toast.error("Coupon is no longer valid for this cart amount")
        }
      })
    }
  }, [cartTotal, addonTotal])

  /* 6. Payment Logic */
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('Online')
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (isLocationServiceable === false) {
        toast.error(`Sorry, delivery is not available in ${resolvedAddress || 'your area'}.`)
        return
    }

    if (!selectedLocation) {
        toast.error("Please add a delivery address")
        return
    }

    // Validate Address Fields
    if (!addressDetails.name || !addressDetails.phone || !addressDetails.house || !addressDetails.city || !addressDetails.pincode) {
        toast.error("Please fill all address details")
        return;
    }

    if (items.length === 0) {
        toast.error("Your cart is empty")
        return
    }
    
    setIsProcessing(true)

    try {
    const orderData = {
            shippingAddress: {
                name: addressDetails.name,
                phone: addressDetails.phone,
                addressLine1: `${addressDetails.house}, ${resolvedAddress || selectedLocation?.name || ''}`.trim(),
                city: addressDetails.city,
                state: "State",
                pincode: addressDetails.pincode
            },
            paymentMethod,
            couponCode: appliedCoupon?.code,
            useWallet: useWallet,
            walletUsed: walletDeduction,
            occasion: occasion,
            occasionName: occasionName,
            cakeMessage: cakeMessage,
            addons: addons,
            scheduledTime: localStorage.getItem('scheduledTime') || null,
            appliedTaxes: computedDetails.appliedTaxesList,
            appliedCharges: computedDetails.appliedChargesList
        }

        if (paymentMethod === 'Online') {
            // 1. Create Razorpay Order
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    couponCode: appliedCoupon?.code,
                    useWallet: useWallet,
                    walletUsed: walletDeduction,
                    distanceKm: storeKm
                })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to create payment order')

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use public key from env
                amount: data.order.amount,
                currency: data.order.currency,
                name: "Villorita",
                description: "Order Payment",
                order_id: data.order.id,
                handler: async function (response: any) {
                    // 2. Verify Payment & Create Order
                    const verifyRes = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                            ...orderData,
                            distanceKm: storeKm,
                            paymentDetails: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        })
                    })
                    
                    const verifyData = await verifyRes.json()
                    if (verifyRes.ok) {
                        localStorage.removeItem('scheduledTime')
                        toast.success("Payment Successful! Order Placed.")
                        router.push('/checkout/success') 
                    } else {
                        toast.error(verifyData.error || "Payment verification failed")
                    }
                },
                prefill: {
                    name: addressDetails.name,
                    email: user?.email || "user@example.com",
                    contact: addressDetails.phone
                },
                theme: {
                    color: "#7E22CE" // Purple-700
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } else {
            // COD Flow
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...orderData, distanceKm: storeKm })
            })
            
            const data = await res.json()
            if (res.ok) {
                 localStorage.removeItem('scheduledTime')
                 toast.success("Order Placed Successfully!")
                 router.push('/checkout/success')
            } else {
                toast.error(data.error || "Failed to place order")
            }
        }
    } catch (error: any) {
        toast.error(error.message || "Something went wrong")
    } finally {
        setIsProcessing(false)
    }
  }

  // Load Razorpay Script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Load script on mount
  useEffect(() => {
      loadRazorpay()
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-8">

      {/* 0. Items in Cart */}
      {items.length > 0 ? (
          <div className="space-y-4">
              <h2 className="text-xl font-bold px-1">Your Order ({items.length})</h2>
              {items.map((item, idx) => (
                  <Card key={idx} className="border-none shadow-sm overflow-hidden">
                      <div className="flex bg-white p-4 gap-4">
                          <div className="h-20 w-20 rounded-xl bg-gray-100 shrink-0 relative overflow-hidden">
                               {/* Valid Image Check/Placeholder */}
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
                          <div className="flex-1 flex flex-col justify-between">
                              <div>
                                  <h3 className="font-bold">{item.name}</h3>
                                  <p className="text-sm text-muted-foreground">{item.weight} (₹{item.selectedPrice}) • {item.type}</p>
                              </div>
                              <div className="mt-2 flex items-end justify-between">
                                  <div className="flex flex-col gap-1 text-sm font-medium">
                                      <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                                      <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary justify-start" onClick={() => router.push(`/product/${item.id}`)}>
                                          Show Detail
                                      </Button>
                                  </div>
                                  <div className="text-right">
                                      <span className="font-bold">₹{item.selectedPrice * item.quantity}</span>
                                      {item.quantity > 1 && (
                                          <p className="text-[10px] text-muted-foreground">(₹{item.selectedPrice} &times; {item.quantity})</p>
                                      )}
                                  </div>
                              </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-red-500 self-start mt-2" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                  </Card>
              ))}
          </div>
      ) : (
          <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-400 mb-6">Your cart is empty</h2>
              <Button 
                onClick={() => router.push('/')}
                className="rounded-xl px-8 py-6 text-lg font-bold shadow-lg shadow-purple-100 hover:shadow-purple-200 transition-all"
              >
                Craving? Order Now
              </Button>
          </div>
      )}
      
      {/* Wallet Section */}
      {walletBalance > 0 && items.length > 0 && (
          <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                          <Checkbox 
                              id="use-wallet" 
                              checked={useWallet}
                              onCheckedChange={(checked) => setUseWallet(checked as boolean)}
                              className="mt-1"
                          />
                          <div className="space-y-1">
                              <label 
                                  htmlFor="use-wallet" 
                                  className="text-sm font-bold cursor-pointer flex items-center gap-2"
                              >
                                  <Wallet className="h-4 w-4 text-purple-600" />
                                  Use Wallet Balance
                              </label>
                              <p className="text-xs text-muted-foreground">
                                  Available: ₹{walletBalance} • {useWallet ? `Using ₹${walletDeduction}` : 'Click to apply'}
                              </p>
                          </div>
                      </div>
                      {useWallet && (
                          <div className="text-right">
                              <p className="text-sm font-bold text-green-600">-₹{walletDeduction}</p>
                              <p className="text-xs text-muted-foreground">Saved</p>
                          </div>
                      )}
                  </div>
              </CardContent>
          </Card>
      )}
      
      {/* 1. Address Section */}
      <Card className="overflow-hidden border-none shadow-sm flex flex-col">
        {isLocationServiceable === false && (
          <div className="bg-red-50 text-red-700 p-4 border-b border-red-100 flex items-start gap-3">
             <div className="bg-red-100 p-2 rounded-full shrink-0">
               <MapPin className="h-5 w-5 text-red-600" />
             </div>
             <div>
               <h4 className="font-bold">Delivery Not Available</h4>
               <p className="text-sm mt-1">
                 {resolvedAddress ? `We currently don't deliver to ${resolvedAddress}.` : "We aren't able to deliver to your exact location."} 
               </p>
             </div>
          </div>
        )}
        <CardHeader className="bg-white pb-4">
             <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Delivery Address
             </CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-6 pt-2">
             {/* Compatible UI for Location Permission */}
             {permissionStatus !== 'granted' && !userLat && (
                <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                        <MapPin className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-sm">Enable Location for Accurate Delivery</h4>
                        <p className="text-xs text-muted-foreground max-w-[240px]">
                            We need your location to calculate the exact distance from our store.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full max-w-[280px]">
                        <Button 
                            variant="default" 
                            size="sm" 
                            className="flex-1 rounded-xl font-bold h-10 shadow-lg shadow-purple-100"
                            onClick={requestLocation}
                        >
                            Use Current Location
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 rounded-xl font-bold h-10 border-gray-200"
                            onClick={() => setManualPromptOpen(true)}
                        >
                            Enter Manually
                        </Button>
                    </div>
                    {permissionStatus === 'denied' && (
                        <p className="text-[10px] text-red-500 font-medium">
                            Location access is blocked. Please enable it in browser settings.
                        </p>
                    )}
                </div>
             )}

             {isLoggedIn ? (
                 <div className="grid gap-4">
                     <div className="grid gap-4">
                        <Input 
                            placeholder="Full Name" 
                            className="bg-gray-50 border-transparent focus:bg-white" 
                            value={addressDetails.name}
                            onChange={(e) => setAddressDetails({...addressDetails, name: e.target.value})}
                        />
                        <Input 
                            placeholder="Phone Number" 
                            className="bg-gray-50 border-transparent focus:bg-white" 
                            value={addressDetails.phone}
                            onChange={(e) => setAddressDetails({...addressDetails, phone: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input 
                            placeholder="House/Flat" 
                            className="bg-gray-50 border-transparent focus:bg-white" 
                            value={addressDetails.house}
                            onChange={(e) => setAddressDetails({...addressDetails, house: e.target.value})}
                        />
                        <Input placeholder="Street/Area" value={resolvedAddress || selectedLocation?.name || ''} readOnly className="bg-gray-100 border-transparent" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input 
                            placeholder="City" 
                            className="bg-gray-50 border-transparent focus:bg-white" 
                            value={addressDetails.city}
                            onChange={(e) => setAddressDetails({...addressDetails, city: e.target.value})}
                        />
                        <Input 
                            placeholder="Pincode" 
                            className="bg-gray-50 border-transparent focus:bg-white" 
                            value={addressDetails.pincode}
                            onChange={(e) => setAddressDetails({...addressDetails, pincode: e.target.value})}
                        />
                     </div>
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center gap-4 py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed hover:bg-gray-50 transition-colors">
                     <p className="text-muted-foreground font-medium">Please login to add address</p>
                     <Button onClick={() => setIsAuthModalOpen(true)} className="rounded-xl px-8">Login</Button>
                 </div>
             )}
        </CardContent>
      </Card>

      {/* 2. Occasion & Message */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="flex-1 bg-white p-6 space-y-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        Occasion
                    </label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between rounded-xl h-12 bg-gray-50 border-transparent hover:bg-gray-100 text-left font-normal text-gray-900">
                                {occasion} <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px]">
                            {["Birthday", "Anniversary", "Celebration", "Other"].map(opt => (
                                <DropdownMenuItem key={opt} onClick={() => setOccasion(opt)}>
                                    {opt}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {occasion === "Birthday" && (
                         <div className="space-y-1 animation-all duration-300">
                             <Input placeholder="Name (Whose Birthday?)" className="bg-gray-50 border-transparent focus:bg-white h-10 text-sm" value={occasionName || ""} onChange={(e) => setOccasionName(e.target.value)} />
                             <p className="text-xs text-muted-foreground text-right">Optional</p>
                         </div>
                    )}

                    {occasion === "Anniversary" && (
                         <div className="space-y-1 animation-all duration-300">
                             <Input placeholder="Name (Whose Anniversary?)" className="bg-gray-50 border-transparent focus:bg-white h-10 text-sm" value={occasionName || ""} onChange={(e) => setOccasionName(e.target.value)} />
                             <p className="text-xs text-muted-foreground text-right">Optional</p>
                         </div>
                    )}

                    {occasion === "Celebration" && (
                        <div className="space-y-3 animation-all duration-300">
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Type</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between rounded-xl h-10 bg-gray-50 border-transparent text-sm">
                                            {occasionName || "Choose Type"} <ChevronDown className="h-3 w-3 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {["New Year", "Christmas", "Reunion", "Farewell", "Get Together"].map(t => (
                                            <DropdownMenuItem key={t} onClick={() => setOccasionName(t)}>{t}</DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                             <div className="space-y-1">
                                <Input placeholder="Other Celebration (Optional)" className="bg-gray-50 border-transparent focus:bg-white h-10 text-sm" value={occasionName || ""} onChange={(e) => setOccasionName(e.target.value)} />
                             </div>
                        </div>
                    )}

                     {occasion === "Other" && (
                          <div className="space-y-1 animation-all duration-300">
                              <Input placeholder="What's the occasion?" className="bg-gray-50 border-transparent focus:bg-white h-10 text-sm" value={occasionName || ""} onChange={(e) => setOccasionName(e.target.value)} />
                          </div>
                     )}
                 </div>
 
                 <div className="flex-1 bg-white p-6 space-y-3">
                     <label className="text-sm font-bold text-gray-700">Message on Cake</label>
                     <Input placeholder="Happy Birthday Riya" className="bg-gray-50 border-transparent focus:bg-white h-12" value={cakeMessage || ""} onChange={(e) => setCakeMessage(e.target.value)} />
                 </div>
             </div>
         </CardContent>
       </Card>
 
       {/* 2.5 Add-ons Section */}
       <Card className="border-none shadow-sm overflow-hidden bg-white">
         <CardHeader className="pb-4">
             <CardTitle className="text-lg flex items-center gap-2">
                 <Gift className="h-5 w-5 text-pink-500" /> Make Celebration better
             </CardTitle>
         </CardHeader>
         <CardContent className="p-6 pt-0 space-y-4">
             {addons.length > 0 && (
                 <div className="space-y-3 mb-6">
                     <h4 className="text-sm font-semibold text-muted-foreground">Added to cart:</h4>
                     {addons.map((a, idx) => (
                         <div key={idx} className="flex items-center justify-between bg-pink-50/50 p-3 rounded-xl border border-pink-100">
                             <div>
                                 <p className="font-medium text-sm text-pink-900">{a.name} x{a.quantity}</p>
                                 <p className="text-xs text-pink-700">₹{a.price * a.quantity}</p>
                             </div>
                             <Button variant="ghost" size="icon" onClick={() => removeAddonFromCart(a.addon)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                 <Trash2 className="h-4 w-4" />
                             </Button>
                         </div>
                     ))}
                 </div>
             )}
             
             <div className="flex gap-3 items-end">
                 <div className="space-y-2 flex-1">
                      <label className="text-xs font-bold text-gray-700">Select Addon (Optional)</label>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between rounded-xl h-12 bg-gray-50 border-transparent text-left font-normal text-gray-900">
                                  {selectedAddonId ? availableAddons.find(a => a._id === selectedAddonId)?.name : "Choose an addon..."} 
                                  <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[200px]">
                              {availableAddons.map(opt => (
                                  <DropdownMenuItem key={opt._id} onClick={() => setSelectedAddonId(opt._id)}>
                                      {opt.name} - ₹{opt.price}
                                  </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                      </DropdownMenu>
                 </div>
                 <div className="space-y-2 w-24">
                      <label className="text-xs font-bold text-gray-700">Qty</label>
                      <Input 
                         type="number" 
                         min="1" 
                         value={addonQuantity} 
                         onChange={(e) => setAddonQuantity(parseInt(e.target.value) || 1)} 
                         className="h-12 bg-gray-50 border-transparent text-center"
                      />
                 </div>
                 <Button 
                     className="h-12 px-6 rounded-xl font-bold bg-pink-600 hover:bg-pink-700 text-white"
                     disabled={!selectedAddonId}
                     onClick={() => {
                         addAddonToCart(selectedAddonId, addonQuantity)
                         setSelectedAddonId("")
                         setAddonQuantity(1)
                     }}
                 >
                     Add
                 </Button>
             </div>
         </CardContent>
       </Card>

       {/* 3. Coupon Section */}
       <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2 text-center">
              <CardTitle className="text-lg tracking-widest text-muted-foreground font-bold">PROMO CODE</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 text-center">
             <div className="flex w-full items-center justify-center gap-3 max-w-sm mx-auto">
                 <Input 
                     placeholder="Enter coupon code" 
                     className="h-12 border-dashed bg-gray-50 uppercase text-center" 
                     value={couponInput}
                     onChange={(e) => setCouponInput(e.target.value)}
                     disabled={!!appliedCoupon}
                 />
                 {appliedCoupon ? (
                     <Button 
                         variant="destructive" 
                         className="h-12 px-8 rounded-xl shrink-0 font-bold"
                         onClick={() => {
                             setAppliedCoupon(null)
                             setCouponInput("")
                             toast.info("Coupon removed")
                         }}
                     >
                         Remove
                     </Button>
                 ) : (
                     <Button 
                         className="h-12 px-8 rounded-xl shrink-0 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                         onClick={handleApplyCoupon}
                         disabled={loadingCoupon || !couponInput}
                     >
                         {loadingCoupon ? "..." : "Apply"}
                     </Button>
                 )}
             </div>
             {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
             {appliedCoupon && <p className="text-green-600 text-sm mt-2 font-medium">Coupon {appliedCoupon.code} applied!</p>}
          </CardContent>
       </Card>
 
       {/* 5. Price Summary */}
       <Card className="border-none shadow-sm bg-white">
         <CardContent className="space-y-4 p-6">
             {(() => {
                 const productSavings = items.reduce((acc, item) => {
                     if (item.cuttedPrice && item.cuttedPrice > item.selectedPrice) {
                         return acc + (item.cuttedPrice - item.selectedPrice) * item.quantity;
                     }
                     return acc;
                 }, 0);
                 
                 return (
                     <>
                         <div className="flex justify-between text-sm">
                             <span className="text-muted-foreground">Cake Price</span>
                             <div className="flex items-center gap-2">
                                 {productSavings > 0 && (
                                     <span className="text-muted-foreground line-through text-xs font-normal">₹{cartTotal + productSavings}</span>
                                 )}
                                 <span className="font-medium">₹{cartTotal}</span>
                             </div>
                         </div>
                         {productSavings > 0 && (
                             <div className="flex justify-between text-sm bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                                 <span className="text-blue-700 font-bold flex items-center gap-1 italic">
                                     <Star className="h-3 w-3 fill-blue-500 text-blue-500" /> Hurray! You Saved Extra
                                 </span>
                                 <span className="font-bold text-blue-700">₹{productSavings}</span>
                             </div>
                         )}
                     </>
                 );
             })()}
             {addonTotal > 0 && (
                 <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground flex items-center gap-1">
                         <Gift className="h-3 w-3" /> Add-ons
                     </span>
                     <span className="font-medium text-pink-600">+ ₹{addonTotal}</span>
                 </div>
             )}
             <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Discount</span>
                 <span className="font-medium text-green-600">- ₹{discount}</span>
             </div>
              {couponDiscount > 0 && (
                 <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Coupon Discount</span>
                     <span className="font-medium text-green-600">- ₹{couponDiscount}</span>
                 </div>
             )}

            {deliveryCharge > 0 ? (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Delivery Charge
                    </span>
                    <span className="font-medium">₹{deliveryCharge}</span>
                </div>
            ) : (deliverySettings && !deliverySettings.isActive) || (deliverySettings?.isActive && deliveryCharge === 0) ? (
                <div className="flex justify-between text-sm bg-green-50 p-2 rounded-lg border border-green-100">
                    <span className="text-green-700 font-bold flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Congratulations! Free Delivery
                    </span>
                    <span className="font-bold text-green-700">₹0</span>
                </div>
            ) : null}
            {/* Delivery breakdown – only shown when there are multiple components */}
            {deliveryBreakdown.length > 1 && (
                <div className="ml-4 space-y-0.5">
                    {deliveryBreakdown.map((row, i) => (
                        <div key={i} className="flex justify-between text-xs text-muted-foreground">
                            <span>{row.label}</span>
                            <span>₹{row.amount}</span>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Dynamic Flat Charges */}
            {computedDetails.appliedChargesList.map((charge, i) => (
                <div key={`charge-${i}`} className="flex justify-between text-sm group relative">
                    <span className="text-muted-foreground flex items-center gap-1 cursor-help border-b border-dashed border-gray-300 pb-0.5">
                        {charge.name}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden w-72 bg-gray-900/95 backdrop-blur-md text-white text-[11px] leading-relaxed p-4 rounded-2xl shadow-2xl group-hover:block z-50 transition-all duration-300 border border-white/10">
                            <div className="flex items-start gap-2">
                                <Info className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                                <p>{charge.description}</p>
                            </div>
                            {/* Little triangle pointer */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-8 border-transparent border-t-gray-900/95"></div>
                        </div>
                    </span>
                    <span className="font-medium">+ ₹{charge.amount}</span>
                </div>
            ))}

            {/* Dynamic Percentage Taxes */}
            {computedDetails.appliedTaxesList.map((tax, i) => (
                <div key={`tax-${i}`} className="flex justify-between text-sm group relative">
                    <span className="text-muted-foreground flex items-center gap-1 cursor-help border-b border-dashed border-gray-300 pb-0.5">
                        {tax.name}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden w-72 bg-gray-900/95 backdrop-blur-md text-white text-[11px] leading-relaxed p-4 rounded-2xl shadow-2xl group-hover:block z-50 transition-all duration-300 border border-white/10">
                            <div className="flex items-start gap-2">
                                <Info className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                                <p>{tax.description}</p>
                            </div>
                            {/* Little triangle pointer */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-8 border-transparent border-t-gray-900/95"></div>
                        </div>
                    </span>
                    <span className="font-medium text-red-600">+ ₹{tax.amount}</span>
                </div>
            ))}

            {useWallet && walletDeduction > 0 && (
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <Wallet className="h-3 w-3" /> Wallet Discount
                    </span>
                    <span className="font-medium text-purple-600">- ₹{walletDeduction}</span>
                </div>
            )}
            <div className="my-4 h-px w-full bg-muted" />
            <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
                <span className="text-lg font-bold text-primary">Final Price</span>
                <span className="text-2xl font-bold text-primary">₹{finalPrice}</span>
            </div>
        </CardContent>
      </Card>

      {/* 4. Payment Method */}
      <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-4">
              <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            <div 
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'Online' ? 'border-primary bg-primary/5' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                onClick={() => setPaymentMethod('Online')}
            >
                <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center">
                    {paymentMethod === 'Online' && <div className="h-3 w-3 rounded-full bg-primary" />}
                </div>
                <div>
                    <h3 className="font-bold">Pay Online ({finalPrice})</h3>
                    <p className="text-xs text-muted-foreground">UPI, Cards, Netbanking (Powerded by Razorpay)</p>
                </div>
            </div>
            
             <div 
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                onClick={() => setPaymentMethod('COD')}
            >
                <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center">
                    {paymentMethod === 'COD' && <div className="h-3 w-3 rounded-full bg-primary" />}
                </div>
                <div>
                    <h3 className="font-bold">Cash on Delivery</h3>
                    <p className="text-xs text-muted-foreground">Pay when you receive the order</p>
                </div>
            </div>

          </CardContent>
      </Card>
        
      {/* 6. Pay Button */}
      {items.length > 0 && (
          <Button 
            className="w-full h-16 rounded-2xl text-xl font-bold shadow-xl shadow-purple-200 hover:shadow-purple-300 transition-all disabled:opacity-50"
            onClick={handlePayment}
            disabled={isProcessing || isLocationServiceable === false}
          >
            {isProcessing ? "Processing..." : `PAY ₹${finalPrice}`}
          </Button>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode="login"
      />
    </div>
  )
}

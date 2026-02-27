"use client"

import { useState, useEffect } from "react"
import { MapPin, Gift, Tag, ChevronDown, Trash2, ShoppingBag, Wallet } from "lucide-react"
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

  useEffect(() => {
    fetch('/api/addons').then(r => r.json()).then(d => {
      if (d.success) setAvailableAddons(d.addons.filter((a: any) => a.isActive))
    })
  }, [])
  
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

  const [couponInput, setCouponInput] = useState("")
  const [loadingCoupon, setLoadingCoupon] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number, walletCashback?: number, type?: string } | null>(null)
  
  // Wallet State
  const [useWallet, setUseWallet] = useState(false)
  const walletBalance = user?.walletBalance || 0
  
  // Dynamic calculation
  const deliveryCharge = selectedLocation ? selectedLocation.fee : 0
  const discount = 0 
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0
  const walletCashback = appliedCoupon?.walletCashback || 0
  const extraCharges = 0
  
  // Calculate wallet deduction (wallet cashback doesn't reduce cart price)
  const subtotalAfterDiscount = cartTotal + addonTotal + deliveryCharge - discount - couponDiscount + extraCharges
  const walletDeduction = useWallet ? Math.min(walletBalance, subtotalAfterDiscount) : 0
  const finalPrice = Math.max(0, subtotalAfterDiscount - walletDeduction)

  const handleApplyCoupon = async () => {
      setLoadingCoupon(true)
      setCouponError("")
      
      const result = await verifyCoupon(couponInput, cartTotal, user?.id)
      
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

  /* 6. Payment Logic */
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('Online')
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    if (!selectedLocation) {
        toast.error("Please add a delivery address")
        return
    }

    // Validate Address Fields
    if (!addressDetails.name || !addressDetails.phone || !addressDetails.house || !addressDetails.city || !addressDetails.pincode) {
        toast.error("Please fill all address details")
        // Highlight empty fields logic could go here
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
                addressLine1: `${addressDetails.house}, ${selectedLocation.name}`,
                city: addressDetails.city,
                state: "State", // Could be added to form if needed
                pincode: addressDetails.pincode
            },
            paymentMethod,
            couponCode: appliedCoupon?.code,
            locationId: selectedLocation._id, // Pass location ID for dynamic fee calculation
            useWallet: useWallet,
            walletUsed: walletDeduction,
            occasion: occasion,
            occasionName: occasionName,
            cakeMessage: cakeMessage,
            addons: addons
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
                    locationId: selectedLocation._id, // Pass location ID
                    useWallet: useWallet,
                    walletUsed: walletDeduction
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
                            paymentDetails: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        })
                    })
                    
                    const verifyData = await verifyRes.json()
                    if (verifyRes.ok) {
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
                body: JSON.stringify(orderData)
            })
            
            const data = await res.json()
            if (res.ok) {
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
                          <div className="flex-1">
                              <h3 className="font-bold">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.weight} • {item.type}</p>
                              <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold">Qty: {item.quantity}</span>
                                  </div>
                                  <span className="font-bold">₹{item.price * item.quantity}</span>
                              </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeFromCart(item.id)}>
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
      <Card className="overflow-hidden border-none shadow-sm">
        <CardHeader className="bg-white pb-4">
             <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Delivery Address
             </CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-6 pt-2">
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
                        <Input placeholder="Street/Area" value={selectedLocation?.name || ''} readOnly className="bg-gray-100 border-transparent" />
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
          <CardHeader className="pb-2">
              <CardTitle className="text-lg">COUPONS</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
             <div className="flex w-full items-center gap-3">
                 <Input 
                     placeholder="Enter coupon code" 
                     className="h-12 border-dashed bg-gray-50 uppercase" 
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
                         className="h-12 px-8 rounded-xl shrink-0 font-bold"
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
             <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Cake Price</span>
                 <span className="font-medium">₹{cartTotal}</span>
             </div>
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

            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Charge</span>
                 <span className="font-medium">₹{deliveryCharge}</span>
            </div>
             <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Extra Charges</span>
                <span className="font-medium">₹{extraCharges}</span>
            </div>
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
            disabled={isProcessing}
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

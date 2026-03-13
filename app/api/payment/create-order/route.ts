import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import Store from '@/models/Store';
import DeliverySettings from '@/models/DeliverySettings';
import DeliveryLocation from '@/models/DeliveryLocation';
import Fee from '@/models/Fee';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/auth';
import { calculateDeliveryCharge } from '@/lib/deliveryCharge';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const body = await request.json();
    const { couponCode, shippingAddress } = body;

    // Validate delivery serviceability if shipping address provided
    if (shippingAddress && shippingAddress.city) {
        const city = shippingAddress.city.toLowerCase().trim();
        const activeLocations = await DeliveryLocation.find({ isActive: true });
        const allowedCityNames = activeLocations.map(loc => loc.name.toLowerCase().trim());
        
        if (!allowedCityNames.includes(city)) {
            return NextResponse.json(
                { error: `Sorry, delivery is not available in ${shippingAddress.city}` },
                { status: 400 }
            );
        }
    }

    // Get user's cart
    console.log(`[API_PAYMENT_CREATE] Fetching cart for UserID=${user.userId}`);
    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(user.userId) }).populate('items.product');

    if (!cart) {
        console.log('[API_PAYMENT_CREATE] Cart not found in DB');
    } else {
        console.log(`[API_PAYMENT_CREATE] Cart found. Items count: ${cart.items.length}`);
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    let itemsTotal = cart.items.reduce((acc: number, item: any) => acc + (item.selectedPrice * item.quantity), 0);
    let addonsTotal = cart.addons ? cart.addons.reduce((acc: number, addon: any) => acc + (addon.price * addon.quantity), 0) : 0;
    let subtotal = itemsTotal + addonsTotal;
    
    console.log(`[API_PAYMENT] itemsTotal=${itemsTotal}, addonsTotal=${addonsTotal}, subtotal=${subtotal}`);

    let discount = 0;

    // Apply coupon logic
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gte: new Date() }
      });

      if (coupon) {
         if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
            if (subtotal >= coupon.minOrderAmount) {
                if (coupon.discountType === 'wallet') {
                    discount = 0;
                } else if (coupon.discountType === 'percentage') {
                    discount = (itemsTotal * coupon.discountValue) / 100;
                    if (coupon.maxDiscount) {
                        discount = Math.min(discount, coupon.maxDiscount);
                    }
                    discount = Math.min(discount, subtotal);
                    discount = Math.round(discount);
                } else {
                    discount = Math.min(coupon.discountValue, subtotal);
                }
            }
         }
      }
    }

    // ── Admin-controlled Delivery Charge ──────────────────────────────────────
    // Use the GPS-computed distance sent from the frontend cart
    const storeKm = typeof body.distanceKm === 'number' ? body.distanceKm : 0;

    const deliverySettings = await DeliverySettings.findOne();
    const deliveryCharge = calculateDeliveryCharge(deliverySettings, storeKm);
    console.log(`[API_PAYMENT] GPS distanceKm=${storeKm}, deliveryCharge=${deliveryCharge}`);
    // ─────────────────────────────────────────────────────────────────────────

    // ── Custom Taxes & Charges ──
    const activeFees = await Fee.find({ isActive: true });
    let totalCustomCharges = 0;
    let totalCustomTaxes = 0;

    activeFees.forEach(fee => {
        if (fee.type === 'charge') {
            totalCustomCharges += fee.value;
        } else if (fee.type === 'tax') {
            let taxBaseValue = 0;
            if (fee.applicableOn.includes('subtotal')) taxBaseValue += itemsTotal; // Fix: avoid subtotal which already includes addonsTotal
            if (fee.applicableOn.includes('delivery')) taxBaseValue += deliveryCharge;
            if (fee.applicableOn.includes('addons')) taxBaseValue += addonsTotal;
            
            // Deduct coupon discount proportionally (assuming discount applies to subtotal + addons mainly)
            // Simple approximation: if discount exists, subtract it from the total taxBaseValue if it exceeds it.
            const effectiveDiscount = discount;
            const effectiveTaxBase = Math.max(0, taxBaseValue - effectiveDiscount);

            const taxAmount = Math.round((effectiveTaxBase * fee.value) / 100);
            totalCustomTaxes += taxAmount;
        }
    });

    console.log(`[API_PAYMENT] Extra Fees: Charges=${totalCustomCharges}, Taxes=${totalCustomTaxes}`);
    // ─────────────────────────────────────────────────────────────────────────

    // Wallet Deduction Logic
    let walletDeduction = 0;
    const { useWallet, walletUsed } = body;

    if (useWallet && walletUsed > 0) {
      const userDoc = await User.findById(user.userId);
      if (userDoc) {
        const userWalletBalance = userDoc.walletBalance || 0;
        const maxDeduction = Math.min(
             userWalletBalance, 
             subtotal - discount + deliveryCharge + totalCustomCharges + totalCustomTaxes,
             walletUsed
        );
        walletDeduction = maxDeduction;
        console.log(`[API_PAYMENT] Wallet applied: ₹${walletDeduction} from balance ₹${userWalletBalance}`);
      }
    }

    const amount = Math.round((subtotal - discount + deliveryCharge + totalCustomCharges + totalCustomTaxes - walletDeduction) * 100); // paise

    console.log(`[API_PAYMENT_DEBUG] subtotal=${subtotal}, discount=${discount}, deliveryCharge=${deliveryCharge}, wallet=${walletDeduction}, final_amount=${amount / 100}`);

    if (amount <= 0) {
         console.log('[API_PAYMENT] Order fully covered by wallet/coupon. Amount is 0.');
         return NextResponse.json({
            success: true,
            order: {
                id: 'order_paid_by_wallet',
                amount: 0,
                currency: 'INR'
            }
         });
    }

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

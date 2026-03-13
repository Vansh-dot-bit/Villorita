import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Cart from '@/models/Cart';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import Store from '@/models/Store';
import DeliverySettings from '@/models/DeliverySettings';
import DeliveryLocation from '@/models/DeliveryLocation';
import WalletCashbackRequest from '@/models/WalletCashbackRequest';
import Fee from '@/models/Fee';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/mail';
import { calculateDeliveryCharge } from '@/lib/deliveryCharge';

// Helper function to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const body = await request.json();
    const {
      shippingAddress,
      paymentMethod = 'COD',
      deliveryDate,
      orderNotes,
      couponCode,
      occasion,
      occasionName,
      cakeMessage,
      paymentDetails, // { razorpay_order_id, razorpay_payment_id, razorpay_signature }
      useWallet,
      walletUsed,
      scheduledTime // User-selected delivery time slot
    } = body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || 
        !shippingAddress.addressLine1 || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.pincode) {
      return NextResponse.json(
        { error: 'Complete shipping address is required' },
        { status: 400 }
      );
    }

    // Validate delivery serviceability
    const city = shippingAddress.city.toLowerCase().trim();
    const activeLocations = await DeliveryLocation.find({ isActive: true });
    const allowedCityNames = activeLocations.map(loc => loc.name.toLowerCase().trim());
    
    if (!allowedCityNames.includes(city)) {
        return NextResponse.json(
            { error: `Sorry, delivery is not available in ${shippingAddress.city}` },
            { status: 400 }
        );
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(user.userId) }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    let itemsTotal = cart.items.reduce((acc: number, item: any) => acc + (item.selectedPrice * item.quantity), 0);
    let addonsTotal = cart.addons ? cart.addons.reduce((acc: number, addon: any) => acc + (addon.price * addon.quantity), 0) : 0;
    let subtotal = itemsTotal + addonsTotal;
    
    let discount = 0;
    let couponId = null;
    let walletCashback = 0; // Track wallet cashback separately

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gte: new Date() }
      });

      if (!coupon) {
        return NextResponse.json(
          { error: 'Invalid or expired coupon code' },
          { status: 400 }
        );
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json(
          { error: 'Coupon usage limit exceeded' },
          { status: 400 }
        );
      }

      // Check minimum order amount
      if (subtotal < coupon.minOrderAmount) {
        return NextResponse.json(
          { error: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon` },
          { status: 400 }
        );
      }

      // Handle wallet coupons differently - no discount, only cashback
      if (coupon.discountType === 'wallet') {
        walletCashback = coupon.discountValue;
        discount = 0; // Wallet coupons don't reduce the cart price
        console.log(`💰 Wallet coupon applied: ${couponCode}, Cashback: ${walletCashback}`);
      } else {
        // Calculate discount for regular coupons
        if (coupon.discountType === 'percentage') {
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
      
      couponId = coupon._id;
    }

    // ── Admin-controlled Delivery Charge ──────────────────────────────────────
    // Use the GPS-computed distance sent from the frontend cart
    const deliveryStoreKm = typeof body.distanceKm === 'number' ? body.distanceKm : 0;
    const deliverySettingsDoc = await DeliverySettings.findOne();
    const deliveryCharge = calculateDeliveryCharge(deliverySettingsDoc, deliveryStoreKm);
    console.log(`[API_ORDERS] GPS distanceKm=${deliveryStoreKm}, deliveryCharge=${deliveryCharge}`);
    // ─────────────────────────────────────────────────────────────────────────

    // ── Custom Taxes & Charges ──
    const activeFees = await Fee.find({ isActive: true });
    let totalCustomCharges = 0;
    let totalCustomTaxes = 0;
    const appliedTaxes: { name: string, amount: number }[] = [];
    const appliedCharges: { name: string, amount: number }[] = [];

    activeFees.forEach(fee => {
        if (fee.type === 'charge') {
             totalCustomCharges += fee.value;
             appliedCharges.push({ name: fee.name, amount: fee.value });
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
            if (taxAmount > 0) {
               totalCustomTaxes += taxAmount;
               appliedTaxes.push({ name: `${fee.name} (${fee.value}%)`, amount: taxAmount });
            }
        }
    });
    // ─────────────────────────────────────────────────────────────────────────

    const totalAmount = subtotal - discount + deliveryCharge + totalCustomCharges + totalCustomTaxes;
    
    // Wallet handling
    let actualWalletUsed = 0;
    if (useWallet && walletUsed > 0) {
      const userDoc = await User.findById(user.userId);
      if (!userDoc) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Verify wallet balance is sufficient
      const userWalletBalance = userDoc.walletBalance || 0;
      actualWalletUsed = Math.min(walletUsed, userWalletBalance, totalAmount);
      
      // Deduct from user's wallet
      userDoc.walletBalance = userWalletBalance - actualWalletUsed;
      await userDoc.save();
    }
    
    // Payment Verification Logic
    let paymentStatus = 'Pending';
    let orderStatus = 'punched'; // Default to 'punched' for all orders
    
    if (paymentMethod === 'Online') {
        if (!paymentDetails || !paymentDetails.razorpay_payment_id || !paymentDetails.razorpay_order_id || !paymentDetails.razorpay_signature) {
             return NextResponse.json(
                { error: 'Payment details missing for online payment' },
                { status: 400 }
            );
        }

        const crypto = require('crypto');
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(paymentDetails.razorpay_order_id + '|' + paymentDetails.razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== paymentDetails.razorpay_signature) {
             return NextResponse.json(
                { error: 'Payment verification failed' },
                { status: 400 }
            );
        }
        
        paymentStatus = 'Paid';
        // orderStatus already set to 'punched' above
    }
    
    // Generate OTP for all orders
    const otp = generateOTP();
    console.log('=== Order Creation Debug ===');
    console.log('Generated OTP:', otp);
    console.log('Order Status:', orderStatus);
    console.log('============================');

    // Increment coupon usage if used and order is successful (or pending COD)
    if (couponId) {
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
    }

    // Detect storeId from the cart items' products
    let storeId: string | undefined;
    let storeSnapshot: { name?: string; address?: string; phone?: string } = {};
    for (const item of cart.items) {
      const productStoreId = (item.product as any)?.storeId;
      if (productStoreId) {
        storeId = productStoreId.toString();
        break; // Use the first one found (all items should be from the same store)
      }
    }

    // Look up store details and snapshot them
    if (storeId) {
      try {
        const storeDoc = await Store.findById(storeId);
        if (storeDoc) {
          storeSnapshot = {
            name: storeDoc.name,
            address: storeDoc.address,
            phone: (storeDoc as any).phone || '',
          };
        }
      } catch (err) {
        console.error('Could not fetch store for snapshot:', err);
      }
    }

    // Calculate making time from the first cart item's preparingTime
    const makingTime = (() => {
      for (const item of cart.items) {
        const prepTime = (item.product as any)?.preparingTime;
        if (prepTime !== undefined && prepTime !== null) {
          return Number(prepTime);
        }
      }
      return 60; // fallback default
    })();

    // Create order
    const order = await Order.create({
      user: user.userId,
      storeId: storeId || undefined,
      storeSnapshot,
      items: cart.items.map(item => ({
        product: item.product._id,
        name: item.name,
        price: item.selectedPrice,
        image: item.image,
        quantity: item.quantity,
        weight: item.weight,
      })),
      addons: cart.addons ? cart.addons.map((a: any) => ({
        addon: a.addon,
        name: a.name,
        price: a.price,
        quantity: a.quantity
      })) : [],
      shippingAddress,
      subtotal,
      discount,
      couponCode: couponCode?.toUpperCase(),
      deliveryCharge,
      appliedTaxes,
      appliedCharges,
      walletUsed: actualWalletUsed,
      walletCashback, // Store wallet cashback amount in order
      totalAmount: totalAmount - actualWalletUsed,
      paymentMethod,
      deliveryDate: deliveryDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Default 2 days
      makingTime,
      scheduledTime: scheduledTime || null,
      orderNotes,
      occasion,
      occasionName,
      cakeMessage,
      orderStatus,
      paymentStatus,
      otp, // Include OTP
      paymentDetails: paymentMethod === 'Online' ? paymentDetails : undefined
    });

    // Create pending wallet cashback request for admin approval
    if (walletCashback > 0) {
      try {
        await WalletCashbackRequest.create({
          user: user.userId,
          order: order._id,
          requestedAmount: walletCashback,
          couponCode: couponCode?.toUpperCase(),
          status: 'pending'
        });
        console.log(`📝 Wallet cashback request created: ₹${walletCashback} pending approval for user ${user.userId}`);
      } catch (err) {
        console.error('❌ Failed to create wallet cashback request:', err);
        // We don't fail the order if cashback creation fails, but we log strictly
      }
    } else {
        console.log('ℹ️ No wallet cashback to process (amount is 0)');
    }

    // Clear cart after order
    cart.items = [] as any;
    cart.addons = [] as any;
    await cart.save();

    // Send confirmation email
    // Retrieve user email from userDoc if available, otherwise fetch from DB
    let userEmail = (user as any).email;
    
    // Always fetch fresh user details to ensure we have the correct email
    try {
        const userDetails = await User.findById(user.userId);
        if (userDetails && userDetails.email) {
            userEmail = userDetails.email;
            console.log(`📧 Resolved user email from DB: ${userEmail}`);
        } else {
            console.warn(`⚠️ Could not find user email in DB for ID: ${user.userId}`);
        }
    } catch (err) {
        console.error('❌ Error fetching user details for email:', err);
    }

    if (userEmail) {
        // Send email asynchronously
        await sendOrderConfirmationEmail(userEmail, order); 
    } else {
        console.error('❌ No email address found for user. Order confirmation not sent.');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order placed successfully',
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET - Get user's orders or all orders (admin)
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    let query: any = {};
    
    console.log('=== ORDERS API DEBUG ===');
    console.log('User from token:', JSON.stringify(user, null, 2));
    console.log('User role:', user.role);
    console.log('User ID:', user.userId);
    
    // If not admin, only show user's own orders
    // CRITICAL FIX: Ensure strict type checking and query construction
    if (user.role !== 'admin') {
      // Convert string userId to proper MongoDB ObjectId for comparison
      query.user = new mongoose.Types.ObjectId(user.userId);
      console.log(`Non-admin user (${user.userId}) - Filtering orders strictly by user ID.`);
      console.log('Query.user type:', typeof query.user);
      console.log('Query.user value:', query.user);
    } else {
      console.log('Admin user - showing all orders');
    }

    console.log('Full MongoDB query:', JSON.stringify(query, null, 2));

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Orders found: ${orders.length}`);
    
    // Double-check mechanism for debugging
    if (orders.length > 0 && user.role !== 'admin') {
        console.log('First order check:');
        console.log('  - Order.user field type:', typeof orders[0].user);
        console.log('  - Order.user value:', orders[0].user);
        
        const firstOrderUserId = orders[0].user?._id?.toString() || orders[0].user?.toString();
        const requestingUserId = user.userId;
        
        console.log('  - First order user ID:', firstOrderUserId);
        console.log('  - Requesting user ID:', requestingUserId);
        
        if (firstOrderUserId && firstOrderUserId !== requestingUserId) {
             console.error('🚨 CRITICAL: DATA LEAK DETECTED! Returning order for wrong user.');
             console.error(`Order belongs to: ${firstOrderUserId}, Requesting user: ${requestingUserId}`);
        } else {
             console.log('✅ Verification passed: Order belongs to requesting user.');
        }
    }
    console.log('=== END DEBUG ===');

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

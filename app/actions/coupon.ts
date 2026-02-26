'use server'

import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupon"
import Order from "@/models/Order"
import mongoose from "mongoose"

export async function verifyCoupon(code: string, orderTotal: number, userId?: string) {
  try {
    await dbConnect()
    
    const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(), 
        isActive: true 
    })

    if (!coupon) {
      return { success: false, message: "Invalid coupon code" }
    }

    // Check expiry
    if (new Date(coupon.expiryDate) < new Date()) {
        return { success: false, message: "Coupon has expired" }
    }

    // Check min order amount
    if (coupon.minOrderAmount > orderTotal) {
        return { success: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` }
    }
    
    // Check total usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { success: false, message: "Coupon usage limit reached" }
    }

    // Check per-user usage limit
    if (coupon.usageLimitPerUser && userId) {
        const userUsageCount = await Order.countDocuments({
            user: new mongoose.Types.ObjectId(userId),
            couponCode: code.toUpperCase(),
            // Only count valid orders (not failed/cancelled if you prefer, but usually all attempts or at least confirmed ones)
            // For now, let's count all non-failed/cancelled orders to be safe, or just all orders where it was applied.
            // Let's stick to orders that are NOT cancelled or failed payment.
            orderStatus: { $ne: 'Cancelled' },
            paymentStatus: { $ne: 'Failed' }
        });

        if (userUsageCount >= coupon.usageLimitPerUser) {
            return { success: false, message: `You have already used this coupon maximum ${coupon.usageLimitPerUser} time(s)` }
        }
    }

    // Handle wallet coupons differently
    if (coupon.discountType === 'wallet') {
        return {
            success: true,
            discount: 0, // No discount on cart
            walletCashback: coupon.discountValue, // Cashback amount
            code: coupon.code,
            type: 'wallet',
            message: `₹${coupon.discountValue} cashback will be added to your wallet after order!`
        }
    }

    // Regular discount coupons
    let discount = 0
    if (coupon.discountType === 'percentage') {
        discount = (orderTotal * coupon.discountValue) / 100
        if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount)
        }
    } else {
        discount = coupon.discountValue
    }

    return { 
        success: true, 
        discount: Math.round(discount),
        walletCashback: 0,
        code: coupon.code,
        type: 'discount',
        message: "Coupon applied successfully"
    }

  } catch (error) {
    console.error("Coupon verification error:", error)
    return { success: false, message: "Error verifying coupon" }
  }
}

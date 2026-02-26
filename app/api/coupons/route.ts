import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import { requireAdmin, getUserFromRequest } from '@/lib/auth';

// POST - Validate coupon
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { code, orderAmount } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gte: new Date() }
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid or expired coupon code' },
        { status: 404 }
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
    if (orderAmount && orderAmount < coupon.minOrderAmount) {
      return NextResponse.json(
        { 
          error: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
          minOrderAmount: coupon.minOrderAmount
        },
        { status: 400 }
      );
    }

    // Handle wallet coupons - add to wallet as CASHBACK (no discount on current order)
    if (coupon.discountType === 'wallet') {
      // Wallet coupons need user authentication
      const authToken = getUserFromRequest(request);
      if (!authToken) {
        return NextResponse.json(
          { error: 'Authentication required to use wallet coupons' },
          { status: 401 }
        );
      }

      const user = await User.findById(authToken.userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Add amount to wallet as cashback
      user.walletBalance = (user.walletBalance || 0) + coupon.discountValue;
      await user.save();

      // Increment coupon usage
      coupon.usedCount += 1;
      await coupon.save();

      return NextResponse.json({
        success: true,
        message: `₹${coupon.discountValue} cashback added to your wallet!`,
        walletCredit: coupon.discountValue,
        newWalletBalance: user.walletBalance,
        type: 'wallet'
      });
    }

    // Calculate discount for percentage/fixed coupons
    let discount = 0;
    if (orderAmount) {
      if (coupon.discountType === 'percentage') {
        discount = (orderAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscount) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        discount = coupon.discountValue;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon is valid',
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        discount: Math.round(discount),
      },
      type: 'discount'
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}

// GET all coupons (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const coupons = await Coupon.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

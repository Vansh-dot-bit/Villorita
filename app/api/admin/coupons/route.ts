import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { requireAdmin } from '@/lib/auth';

// POST - Create new coupon (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiryDate,
      usageLimit,
    } = body;

    // Validation
    if (!code || !discountType || !discountValue || !expiryDate) {
      return NextResponse.json(
        { error: 'Please provide code, discountType, discountValue, and expiryDate' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      );
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount,
      expiryDate,
      usageLimit,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Coupon created successfully',
        coupon,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

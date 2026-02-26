import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function GET() {
  await dbConnect();
  
  const coupons = await Coupon.find({});
  
  return NextResponse.json({
    count: coupons.length,
    coupons: coupons.map(c => ({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      isActive: c.isActive,
      minOrderAmount: c.minOrderAmount
    }))
  });
}

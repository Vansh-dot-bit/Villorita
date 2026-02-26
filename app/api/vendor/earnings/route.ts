import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Store from '@/models/Store';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    // Find the store belonging to this vendor
    const store = await Store.findOne({ vendorId: new mongoose.Types.ObjectId(user.userId) });
    if (!store) {
      return NextResponse.json({ success: true, earnings: { total: 0, adminCut: 0, vendorShare: 0, adminCutPercentage: 0, orderCount: 0 } });
    }

    const adminCutPct = store.adminCutPercentage ?? 0;

    // Aggregate delivered orders for this store
    const result = await Order.aggregate([
      {
        $match: {
          storeId: store._id,
          paymentStatus: 'Paid',
        },
      },
      { $unwind: '$items' },
      {
        $project: {
          itemRevenue: { $multiply: ['$items.price', '$items.quantity'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$itemRevenue' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const raw = result[0] || { totalRevenue: 0, orderCount: 0 };
    const adminCut = Math.round((raw.totalRevenue * adminCutPct) / 100);
    const vendorShare = Math.round(raw.totalRevenue - adminCut);

    return NextResponse.json({
      success: true,
      earnings: {
        total: raw.totalRevenue,
        adminCut,
        vendorShare,
        adminCutPercentage: adminCutPct,
        orderCount: raw.orderCount,
        storeName: store.name,
      },
    });
  } catch (error: any) {
    console.error('Vendor earnings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

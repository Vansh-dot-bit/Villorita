import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireVendor } from '@/lib/auth';
import { getStoreByVendorId } from '@/lib/stores';

export async function GET(request: Request) {
  try {
    const vendor = requireVendor(request);
    if (vendor instanceof Response) return vendor;

    await dbConnect();

    const vendorId = (vendor as any).userId;

    // Get the vendor's assigned store
    const store = await getStoreByVendorId(vendorId);
    if (!store) {
      return NextResponse.json({ success: true, orders: [], message: 'No store assigned to this vendor.' });
    }

    const storeId = (store as any)?._id;

    // Fetch orders for this vendor: match by storeId OR by vendor userId (fallback for older orders)
    const query: any = {
      orderStatus: { $in: ['preparing your cake', 'Awaiting Agent', 'Out for Delivery', 'Delivered', 'Cancelled'] },
      $or: [
        ...(storeId ? [{ storeId }] : []),
        { vendor: vendorId },
      ],
    };

    const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      orders,
      adminCutPercentage: (store as any)?.adminCutPercentage || 0
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor orders' },
      { status: 500 }
    );
  }
}

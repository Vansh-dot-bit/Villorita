import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireVendor } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const vendor = requireVendor(request);
    if (vendor instanceof Response) return vendor;

    await dbConnect();
    
    // Get vendor ID from authenticated user
    const vendorId = vendor.userId;
    
    // Get all orders assigned to this vendor
    const totalOrders = await Order.countDocuments({ vendor: vendorId });
    
    // Get orders that are currently being prepared
    const preparingOrders = await Order.countDocuments({ 
      vendor: vendorId,
      orderStatus: 'preparing your cake'
    });
    
    // Get delivered orders
    const completedOrders = await Order.countDocuments({ 
      vendor: vendorId,
      orderStatus: 'Delivered'
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalAssigned: totalOrders,
        preparing: preparingOrders,
        completed: completedOrders,
        cancelled: await Order.countDocuments({ vendor: vendorId, orderStatus: 'Cancelled' })
      },
    });
  } catch (error) {
    console.error('Get vendor stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor stats' },
      { status: 500 }
    );
  }
}

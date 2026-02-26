import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Store from '@/models/Store';
import { requireVendor } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const vendor = requireVendor(request);
    if (vendor instanceof Response) return vendor;

    await dbConnect();
    
    // Fetch vendor's store to get their cut percentage
    const store = await Store.findOne({ vendorId: vendor.id });
    const adminCutPercentage = store?.adminCutPercentage || 0;
    const vendorShareMultiplier = (100 - adminCutPercentage) / 100;

    // Find all delivered orders for THIS vendor
    const orders = await Order.find({ 
      vendor: vendor.id,
      orderStatus: 'Delivered'
    }).sort({ createdAt: -1 });

    let totalRevenue = 0;
    const enrichedOrders = [];

    for (const order of orders) {
      let orderRevenue = 0;
      const enrichedItems = [];

      for (const item of order.items) {
        // Calculate vendor revenue based on selling price and their cut
        const itemSellingPriceTotal = item.price * item.quantity;
        const itemRevenue = itemSellingPriceTotal * vendorShareMultiplier;
        
        orderRevenue += itemRevenue;

        enrichedItems.push({
          name: item.name,
          quantity: item.quantity,
          weight: item.weight,
          price: item.price,
          adminCutPercentage,
          itemRevenue
        });
      }

      totalRevenue += orderRevenue;

      enrichedOrders.push({
        _id: order._id,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        items: enrichedItems,
        vendorRevenue: orderRevenue
      });
    }

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      metrics: {
        totalRevenue,
        orderCount: orders.length
      }
    });
  } catch (error) {
    console.error('Vendor financial error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}

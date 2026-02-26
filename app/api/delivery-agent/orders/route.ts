import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireDeliveryAgent } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const agent = requireDeliveryAgent(request);
    if (agent instanceof Response) return agent;

    await dbConnect();

    // All orders awaiting an agent (available to any agent) + orders this agent accepted
    const orders = await Order.find({
      $or: [
        { orderStatus: 'Awaiting Agent' },
        { orderStatus: { $in: ['Out for Delivery', 'Delivered'] }, deliveryAgent: agent.userId },
        // Admin can see all
        ...(agent.role === 'admin' ? [{ orderStatus: { $in: ['Out for Delivery', 'Delivered'] } }] : []),
      ]
    })
    .populate('user', 'name email phone')
    .populate({
      path: 'storeId',
      select: 'name address vendorId',
      populate: { path: 'vendorId', select: 'name phone' }
    })
    .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error('Get delivery agent orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

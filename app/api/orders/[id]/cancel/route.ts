import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import razorpay from '@/lib/razorpay';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();
    const { id } = await context.params;
    const body = await request.json();
    const { reason } = body;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership
    if (order.user.toString() !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (['Cancelled', 'Delivered', 'Out for Delivery'].includes(order.orderStatus)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage (Delivered or Out for Delivery)' },
        { status: 400 }
      );
    }

    // Unified Cancellation Request Flow for 'punched' and 'preparing your cake'
    if (['punched', 'preparing your cake'].includes(order.orderStatus)) {
         console.log(`[API_CANCEL] Processing cancellation request for order ${id}. Status: ${order.orderStatus}`);
         
         order.cancellationRequest = {
             reason: reason || 'User requested cancellation',
             status: 'Pending',
             requestedAt: new Date()
         };
         await order.save();
         
         console.log(`[API_CANCEL] Order ${id} updated. Cancellation Request Status: Pending`);

         return NextResponse.json({
             success: true,
             message: 'Cancellation request submitted to admin for approval',
             order
         });
    }

    return NextResponse.json({ error: 'Invalid cancellation request' }, { status: 400 });

  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

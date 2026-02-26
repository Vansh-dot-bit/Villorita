import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireDeliveryAgent } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = requireDeliveryAgent(request);
    if (agent instanceof Response) return agent;

    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { action, otp } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // --- Accept delivery request ---
    if (action === 'accept') {
      if (order.orderStatus !== 'Awaiting Agent') {
        return NextResponse.json(
          { error: `Cannot accept. Current status: ${order.orderStatus}` },
          { status: 400 }
        );
      }

      order.orderStatus = 'Out for Delivery';
      order.deliveryAgent = agent.userId as any;
      order.updatedAt = new Date();
      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Delivery accepted. Order is now out for delivery.',
        order,
      });
    }

    // --- Verify OTP and mark delivered ---
    if (action === 'verify_otp') {
      if (order.orderStatus !== 'Out for Delivery') {
        return NextResponse.json(
          { error: `Cannot verify. Current status: ${order.orderStatus}` },
          { status: 400 }
        );
      }

      if (!otp) {
        return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
      }

      if (order.otp !== otp.toString()) {
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }

      order.orderStatus = 'Delivered';
      order.updatedAt = new Date();
      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Order delivered successfully!',
        order,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Delivery agent order action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

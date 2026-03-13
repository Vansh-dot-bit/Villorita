import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireVendor } from '@/lib/auth';

// PATCH - Vendor marks order ready for delivery agent pickup
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const vendor = requireVendor(request);
    if (vendor instanceof Response) return vendor;

    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'mark_out_for_delivery') {
      if (order.orderStatus !== 'preparing your cake') {
        return NextResponse.json(
          { error: `Cannot send to agent. Current status: ${order.orderStatus}` },
          { status: 400 }
        );
      }

      order.orderStatus = 'Awaiting Agent';
      order.updatedAt = new Date();
      await order.save();

      // Send email to all active delivery agents
      const User = (await import('@/models/User')).default;
      // We look for delivery agents. If you rely on isVerified, include it.
      const agents = await User.find({ role: 'delivery_agent' });
      const agentEmails = agents.map(a => a.email).filter(Boolean);
      if (agentEmails.length > 0) {
          import('@/lib/mail').then(({ sendDeliveryAgentNotification }) => {
              sendDeliveryAgentNotification(agentEmails, order._id.toString());
          }).catch(e => console.error("Failed to load mail library", e));
      }

      return NextResponse.json({
        success: true,
        message: 'Order sent to delivery agent for pickup',
        order,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Vendor order action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

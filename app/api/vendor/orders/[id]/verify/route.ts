import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireVendor } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const vendor = requireVendor(request);
    if (vendor instanceof Response) return vendor;

    await dbConnect();
    const { id } = await params;
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is in correct status
    if (order.orderStatus !== 'Out for Delivery') {
      return NextResponse.json(
        { error: 'Order is not out for delivery' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (order.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }
    
    // Check expiration (optional, but good practice)
    // if (order.otpExpires && new Date() > new Date(order.otpExpires)) {
    //    return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    // }

    // Update order status
    order.orderStatus = 'Delivered';
    order.paymentStatus = 'Paid'; // Assume COD is paid on delivery
    order.updatedAt = new Date();
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order verified and delivered successfully',
      order
    });

  } catch (error) {
    console.error('Order verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify order' },
      { status: 500 }
    );
  }
}

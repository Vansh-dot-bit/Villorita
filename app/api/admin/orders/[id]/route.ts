import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireAuth, requireAdmin } from '@/lib/auth';

// PATCH - Admin verifies order (changes status from 'punched' to 'preparing your cake')
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action !== 'verify') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findById(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order is in 'punched' status
    if (order.orderStatus !== 'punched') {
      return NextResponse.json(
        { error: `Cannot verify order with status: ${order.orderStatus}` },
        { status: 400 }
      );
    }

    // Update order status
    order.orderStatus = 'preparing your cake';
    order.updatedAt = new Date();
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order verified successfully',
      order,
    });
  } catch (error) {
    console.error('Admin order verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify order' },
      { status: 500 }
    );
  }
}

// GET - Get single order details (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();

    const { id } = await params;
    const order = await Order.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name category');

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

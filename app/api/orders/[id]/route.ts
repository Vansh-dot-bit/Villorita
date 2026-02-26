import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireAdmin, requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();
    const { id } = await params;
    
    console.log('=== ORDER DETAIL API DEBUG ===');
    console.log('Order ID requested:', id);
    console.log('Logged in user ID:', user.userId);
    console.log('User role:', user.role);
    
    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('vendor', 'name email')
      .populate('items.product');

    if (!order) {
      console.log('Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Order found - belongs to user ID:', order.user._id.toString());
    console.log('Logged in user ID:', user.userId);
    console.log('IDs match?', order.user._id.toString() === user.userId);

    // Check authorization: users can only view their own orders, admins and vendors can view all
    if (user.role !== 'admin' && user.role !== 'vendor' && order.user._id.toString() !== user.userId) {
      console.log('AUTHORIZATION FAILED - User trying to access another users order');
      return NextResponse.json(
        { error: 'Unauthorized to view this order' },
        { status: 403 }
      );
    }

    console.log('Authorization passed');
    console.log('=== END DEBUG ===');

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Ensure admin checks
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { status, paymentStatus, action } = body;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (action === 'verify_payment') {
        order.paymentStatus = 'Paid';
        order.orderStatus = 'Confirmed';
    } else if (action === 'admin_verify') {
        // Admin verifies order -> Generate OTP -> Status 'preparing your cake'
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        order.otp = otp;
        order.orderStatus = 'preparing your cake';
    } else if (action === 'assign_vendor') {
        // Assign vendor to order and also set storeId for vendor panel visibility
        const { vendorId } = body;
        if (!vendorId) {
            return NextResponse.json(
                { error: 'Vendor ID is required' },
                { status: 400 }
            );
        }
        order.vendor = vendorId;

        // Also link the vendor's store so vendor panel can filter by storeId
        const Store = (await import('@/models/Store')).default;
        const vendorStore = await Store.findOne({ vendorId, isActive: true });
        if (vendorStore) {
            order.storeId = vendorStore._id;
            // Update storeSnapshot too
            order.storeSnapshot = {
                name: vendorStore.name,
                address: vendorStore.address || '',
                phone: vendorStore.phone || '',
            };
        }
    } else if (action === 'vendor_verify') {
        // Vendor verifies delivery -> Check OTP -> Status 'Delivered'
        const { otp } = body;
        if (!otp || otp !== order.otp) {
             return NextResponse.json(
                { error: 'Invalid OTP' },
                { status: 400 }
            );
        }
        order.orderStatus = 'Delivered';
        order.paymentStatus = 'Paid'; // Ensure paid on delivery
        order.otp = undefined; // Clear OTP after successful delivery
    } else if (status) {
        order.orderStatus = status;
        if (status === 'Delivered') {
            order.paymentStatus = 'Paid'; // Assume paid if delivered (especially for COD)
        }
    } else if (paymentStatus) {
        order.paymentStatus = paymentStatus;
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

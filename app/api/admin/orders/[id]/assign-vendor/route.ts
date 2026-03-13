import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/auth';

import { sendVendorItemAssignedEmail } from '@/lib/mail';
import User from '@/models/User';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    const { id: orderId } = await params;
    const body = await request.json();
    const { itemId, vendorId, vendorStatus = 'Pending' } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const item = order.items.find((i: any) => i._id?.toString() === itemId);

    if (!item) {
      return NextResponse.json({ error: 'Item not found in order' }, { status: 404 });
    }

    // Capture old vendorId to avoid sending email if assigning to the same vendor
    const oldVendorId = item.vendor?.toString();

    // Assign vendor or unassign if vendorId is empty
    item.vendor = vendorId ? new mongoose.Types.ObjectId(vendorId) : undefined;
    item.vendorStatus = vendorId ? vendorStatus : 'Pending';

    order.markModified('items');
    await order.save();

    // Send email notification to new vendor
    if (vendorId && vendorId !== oldVendorId) {
       const assignedVendor = await User.findById(vendorId);
       if (assignedVendor && assignedVendor.email) {
          // Fire and forget email
          sendVendorItemAssignedEmail(assignedVendor.email, orderId, assignedVendor.name, item.name).catch(console.error);
       }
    }

    // Re-fetch with populated vendor to return updated data
    const updatedOrder = await Order.findById(orderId)
       .populate('user', 'name email phone')
       .populate('vendor', 'name email')
       .populate('items.vendor', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Vendor assigned to item successfully',
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Assign item vendor error:', error);
    return NextResponse.json(
      { error: 'Failed to assign vendor to item', details: error.message },
      { status: 500 }
    );
  }
}

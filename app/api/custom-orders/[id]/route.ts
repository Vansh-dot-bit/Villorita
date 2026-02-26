import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CustomOrder from '@/models/CustomOrder';
import { requireAuth, requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Get single custom order
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid custom order ID' },
        { status: 400 }
      );
    }

    const customOrder = await CustomOrder.findById(id).populate('user', 'name email phone');

    if (!customOrder) {
      return NextResponse.json(
        { error: 'Custom order not found' },
        { status: 404 }
      );
    }

    // Check if user owns this order or is admin
    if (user.role !== 'admin' && customOrder.user._id.toString() !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to view this custom order' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      customOrder,
    });
  } catch (error) {
    console.error('Get custom order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom order' },
      { status: 500 }
    );
  }
}

// PATCH - Update custom order (Admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid custom order ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, quotedPrice, finalPrice, adminNotes } = body;

    const updateData: any = { updatedAt: Date.now() };

    if (status) updateData.status = status;
    if (quotedPrice !== undefined) updateData.quotedPrice = quotedPrice;
    if (finalPrice !== undefined) updateData.finalPrice = finalPrice;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const customOrder = await CustomOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'name email');

    if (!customOrder) {
      return NextResponse.json(
        { error: 'Custom order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Custom order updated successfully',
      customOrder,
    });
  } catch (error) {
    console.error('Update custom order error:', error);
    return NextResponse.json(
      { error: 'Failed to update custom order' },
      { status: 500 }
    );
  }
}

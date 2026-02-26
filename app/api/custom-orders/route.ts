import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CustomOrder from '@/models/CustomOrder';
import { requireAuth, requireAdmin } from '@/lib/auth';

// GET - Retrieve custom orders
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    let query: any = {};

    // If not admin, only show user's own orders
    if (user.role !== 'admin') {
      query.user = user.userId;
    }

    const customOrders = await CustomOrder.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: customOrders.length,
      customOrders,
    });
  } catch (error) {
    console.error('Get custom orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch custom orders' },
      { status: 500 }
    );
  }
}

// POST - Create new custom order
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const body = await request.json();
    const { imageUrl, flavor, description } = body;

    // Validation
    if (!imageUrl || !flavor || !description) {
      return NextResponse.json(
        { error: 'Please provide imageUrl, flavor, and description' },
        { status: 400 }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        { error: 'Description cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    const customOrder = await CustomOrder.create({
      user: user.userId,
      imageUrl,
      flavor,
      description,
      status: 'pending',
    });

    const populatedOrder = await CustomOrder.findById(customOrder._id).populate('user', 'name email');

    return NextResponse.json(
      {
        success: true,
        message: 'Custom order submitted successfully',
        customOrder: populatedOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create custom order error:', error);
    return NextResponse.json(
      { error: 'Failed to create custom order' },
      { status: 500 }
    );
  }
}

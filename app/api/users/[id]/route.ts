import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'admin', 'vendor', 'delivery_agent'].includes(role)) {
        return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
        );
    }

    // Check if user exists and prevent admin role changes
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent changing admin role for security
    if (existingUser.role === 'admin' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot modify admin role' },
        { status: 403 }
      );
    }

    const user = await User.findByIdAndUpdate(
        id, 
        { role }, 
        { new: true }
    ).select('-password');

    return NextResponse.json({
      success: true,
      message: 'User role updated',
      user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

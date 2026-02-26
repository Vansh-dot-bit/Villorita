import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const userProfile = await User.findById(user.userId).select('-password');

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userProfile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const body = await request.json();
    const { name, phone, email } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // Email update with duplicate check
    if (email) {
        if (email !== (user as any).email) { // assuming user object from requireAuth has email, or we fetch user first
             // Check if email is already taken
             const existingUser = await User.findOne({ email, _id: { $ne: user.userId } });
             if (existingUser) {
                 return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
             }
             updateData.email = email;
        }
    }

    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

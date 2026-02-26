import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    
    // Fetch all users, exclude password
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

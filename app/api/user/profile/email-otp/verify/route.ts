import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userAuth = requireAuth(request);
    if (userAuth instanceof Response) return userAuth;

    await dbConnect();
    const { newEmail, otp } = await request.json();

    if (!newEmail || !otp) {
      return NextResponse.json({ error: 'New email and OTP are required' }, { status: 400 });
    }

    const user = await User.findById(userAuth.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (String(user.otp) !== String(otp)) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (user.otpExpires && user.otpExpires < new Date()) {
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    // Update email and clear OTP
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { email: newEmail }, 
        $unset: { otp: '', otpExpires: '' } 
      }
    );

    return NextResponse.json({ success: true, message: 'Email updated successfully' });
  } catch (error: any) {
    console.error('Email OTP Verify Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

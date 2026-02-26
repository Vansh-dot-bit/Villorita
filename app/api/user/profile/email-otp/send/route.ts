import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';
import { sendOTP } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const userAuth = requireAuth(request);
    if (userAuth instanceof Response) return userAuth;

    await dbConnect();
    const { newEmail } = await request.json();

    if (!newEmail) {
      return NextResponse.json({ error: 'New email is required' }, { status: 400 });
    }

    // Check if new email is already in use by another user
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userAuth.userId) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.updateOne(
      { _id: userAuth.userId },
      { $set: { otp, otpExpires } }
    );

    // Send email
    try {
      await sendOTP(newEmail, otp);
    } catch (emailErr: any) {
      console.error('Email sending failed for profile update:', emailErr);
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Email OTP Send Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

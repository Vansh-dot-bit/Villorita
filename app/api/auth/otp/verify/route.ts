import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    // phoneVerified: true is sent from frontend when Firebase SMS OTP was confirmed
    const { email, otp, phoneVerified } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (String(user.otp) !== String(otp)) {
      return NextResponse.json({ error: 'Invalid email OTP' }, { status: 400 });
    }

    if (user.otpExpires && user.otpExpires < new Date()) {
      return NextResponse.json({ error: 'Email OTP expired' }, { status: 400 });
    }

    // Build the update object
    const updateSet: Record<string, unknown> = { isVerified: true };
    if (phoneVerified === true) {
      updateSet.isPhoneVerified = true;
    }

    // Clear OTP and mark verified — use updateOne to avoid full-document validation
    await User.updateOne(
      { _id: user._id },
      { $set: updateSet, $unset: { otp: '', otpExpires: '' } }
    );

    const token = generateToken(user._id.toString(), user.role);

    return NextResponse.json({
      success: true,
      message: 'Verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        googleId: user.googleId,
      },
    });

  } catch (error: any) {
    console.error('❌ OTP Verify Error:', error?.message || error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message }, { status: 500 });
  }
}

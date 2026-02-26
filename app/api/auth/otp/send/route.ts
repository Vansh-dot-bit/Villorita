import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { sendOTP } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, mode, name, phone } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let user = await User.findOne({ email });

    if (mode === 'signup') {
      if (user && user.isVerified) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }
      if (!user) {
        user = await User.create({ name, email, phone, isVerified: false });
      } else {
        // Update unverified user details without triggering full validation
        await User.updateOne({ _id: user._id }, { $set: { name, phone } });
        user.name = name;
        user.phone = phone;
      }
    } else if (mode === 'login') {
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid auth mode or user missing' }, { status: 400 });
    }

    // Generate 6-digit OTP — use updateOne to bypass Mongoose validation issues on old documents
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.updateOne(
      { _id: user._id },
      { $set: { otp, otpExpires } }
    );

    console.log(`✅ OTP generated for ${email}: ${otp}`);

    // Attempt to send email — non-fatal if it fails
    try {
      const emailSent = await sendOTP(email, otp);
      if (!emailSent) {
        console.warn(`⚠️ OTP email failed for ${email}. OTP in DB: ${otp}`);
      }
    } catch (emailErr: any) {
      console.error('⚠️ Email exception (non-fatal):', emailErr?.message || emailErr);
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });

  } catch (error: any) {
    console.error('❌ OTP Send Error:', error?.message || error);
    console.error('   Stack:', error?.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error?.message },
      { status: 500 }
    );
  }
}

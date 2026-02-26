import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { googleId, email, name, picture } = await request.json();

    if (!googleId || !email) {
      return NextResponse.json({ error: 'Google ID and Email are required' }, { status: 400 });
    }

    // Find user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }]
    });

    if (!user) {
      // Create new user
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        isVerified: true,
      });
    } else {
      // Update existing user with googleId if missing
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const token = generateToken(user._id.toString(), user.role);

    return NextResponse.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        googleId: user.googleId,
      },
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

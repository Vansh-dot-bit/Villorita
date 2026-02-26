import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth } from '@/lib/auth';

// GET all addresses
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const userProfile = await User.findById(user.userId).select('addresses');

    return NextResponse.json({
      success: true,
      addresses: userProfile?.addresses || [],
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST - Add new address
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const body = await request.json();
    const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = body;

    // Validation
    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json(
        { error: 'Please provide all required address fields' },
        { status: 400 }
      );
    }

    const userProfile = await User.findById(user.userId);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      userProfile.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Add new address
    userProfile.addresses.push({
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault: isDefault || userProfile.addresses.length === 0, // First address is default
    });

    await userProfile.save();

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
      addresses: userProfile.addresses,
    });
  } catch (error) {
    console.error('Add address error:', error);
    return NextResponse.json(
      { error: 'Failed to add address' },
      { status: 500 }
    );
  }
}

// DELETE - Remove address
export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('addressId');

    if (!addressId) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    const userProfile = await User.findById(user.userId);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    userProfile.addresses = userProfile.addresses.filter(
      addr => addr._id.toString() !== addressId
    );

    await userProfile.save();

    return NextResponse.json({
      success: true,
      message: 'Address removed successfully',
      addresses: userProfile.addresses,
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Failed to remove address' },
      { status: 500 }
    );
  }
}

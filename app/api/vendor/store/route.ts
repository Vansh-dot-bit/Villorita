import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireVendor } from '@/lib/auth';
import { getStoreByVendorId } from '@/lib/stores';
import Store from '@/models/Store';

export async function GET(request: NextRequest) {
  try {
    const user = requireVendor(request);
    if (user instanceof NextResponse) return user;

    await dbConnect();
    const vendorId = (user as any).userId;
    const store = await getStoreByVendorId(vendorId);

    if (!store) {
      return NextResponse.json({ success: true, store: null, message: 'No store assigned yet.' });
    }
    
    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error('Error fetching vendor store:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vendor store' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = requireVendor(request);
    if (user instanceof NextResponse) return user;

    await dbConnect();
    const vendorId = (user as any).userId;

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'isActive must be a boolean' }, { status: 400 });
    }

    // Find this vendor's store and update its availability
    const updatedStore = await Store.findOneAndUpdate(
      { vendorId },
      { isActive, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedStore) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      store: updatedStore,
      message: isActive ? 'Store is now AVAILABLE to customers.' : 'Store is now UNAVAILABLE to customers.',
    });
  } catch (error) {
    console.error('Error updating store availability:', error);
    return NextResponse.json({ success: false, error: 'Failed to update store availability' }, { status: 500 });
  }
}

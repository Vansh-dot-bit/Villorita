import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireVendor } from '@/lib/auth';
import { getStoreByVendorId } from '@/lib/stores';

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

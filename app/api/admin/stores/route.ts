import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();

    const stores = await Store.find({}).sort({ createdAt: -1 }).populate('vendorId', 'name email');
    
    return NextResponse.json({ success: true, stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();

    const body = await request.json();
    const store = await Store.create(body);

    return NextResponse.json({ success: true, store }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create store' },
      { status: 500 }
    );
  }
}

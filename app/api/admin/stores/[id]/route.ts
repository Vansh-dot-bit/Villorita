import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();
    const resolvedParams = await params;

    const store = await Store.findById(resolvedParams.id).populate('vendorId', 'name email');
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch store' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();
    const resolvedParams = await params;

    const body = await request.json();
    const store = await Store.findByIdAndUpdate(resolvedParams.id, body, {
      new: true,
      runValidators: true,
    }).populate('vendorId', 'name email');

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, store });
  } catch (error: any) {
    console.error('Error updating store:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update store' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();
    const resolvedParams = await params;

    const store = await Store.findByIdAndDelete(resolvedParams.id);

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete store' }, { status: 500 });
  }
}

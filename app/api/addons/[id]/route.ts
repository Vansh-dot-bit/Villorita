import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AddOn from '@/models/AddOn';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    const body = await request.json();
    await dbConnect();
    
    // Await params if Next.js > 15
    const id = await Promise.resolve(params.id);

    const addon = await AddOn.findByIdAndUpdate(id, body, { new: true });
    
    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, addon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update addon' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    
    const id = await Promise.resolve(params.id);
    const addon = await AddOn.findByIdAndDelete(id);

    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Addon deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete addon' }, { status: 500 });
  }
}

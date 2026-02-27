import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AddOn from '@/models/AddOn';
import { requireAdmin } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    const body = await request.json();
    await dbConnect();

    const { id } = await context.params;

    const addon = await AddOn.findByIdAndUpdate(id, body, { new: true });

    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, addon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update addon' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();

    const { id } = await context.params;
    const addon = await AddOn.findByIdAndDelete(id);

    if (!addon) {
      return NextResponse.json({ error: 'Addon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Addon deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete addon' }, { status: 500 });
  }
}

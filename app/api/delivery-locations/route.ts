import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DeliveryLocation from '@/models/DeliveryLocation';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  await dbConnect();
  try {
    const locations = await DeliveryLocation.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json({ success: true, locations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();
    const { name, fee } = await request.json();

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const location = await DeliveryLocation.create({ name, fee: Number(fee) });
    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create location' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await DeliveryLocation.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}

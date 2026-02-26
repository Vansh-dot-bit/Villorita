import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AddOn from '@/models/AddOn';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const addons = await AddOn.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, addons });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch addons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    const body = await request.json();
    await dbConnect();

    const addon = await AddOn.create(body);
    return NextResponse.json({ success: true, addon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create addon' }, { status: 500 });
  }
}

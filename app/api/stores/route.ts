import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch stores that are active and listed on home
    const stores = await Store.find({ isActive: true, isListedOnHome: true })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, stores });
  } catch (error) {
    console.error('Error fetching public stores:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stores' }, { status: 500 });
  }
}

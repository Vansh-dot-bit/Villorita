import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PartnerApplication from '@/models/PartnerApplication';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch all partner applications (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const applications = await PartnerApplication.find({})
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('Get all partner applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

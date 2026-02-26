import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PartnerApplication from '@/models/PartnerApplication';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH - Update application status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const { id } = await params;
    const { status } = await request.json();

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const application = await PartnerApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email');

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application,
    });
  } catch (error) {
    console.error('Update partner application error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

// GET - Fetch single application (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const { id } = await params;

    const application = await PartnerApplication.findById(id)
      .populate('userId', 'name email phone')
      .lean();

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Get partner application error:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

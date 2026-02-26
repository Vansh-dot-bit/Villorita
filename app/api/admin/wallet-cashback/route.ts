import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WalletCashbackRequest from '@/models/WalletCashbackRequest';
import { requireAuth, requireAdmin } from '@/lib/auth';

// GET - Fetch all pending wallet cashback requests (Admin only)
export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    const adminCheck = requireAdmin(request);
    if (adminCheck instanceof Response) return adminCheck;

    await dbConnect();

    const pendingRequests = await WalletCashbackRequest.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .populate('order', '_id createdAt totalAmount')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: pendingRequests.length,
      requests: pendingRequests,
    });
  } catch (error) {
    console.error('Fetch pending cashback requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending requests' },
      { status: 500 }
    );
  }
}

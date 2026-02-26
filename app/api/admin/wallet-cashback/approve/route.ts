import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WalletCashbackRequest from '@/models/WalletCashbackRequest';
import User from '@/models/User';
import { requireAuth, requireAdmin } from '@/lib/auth';

// POST - Approve wallet cashback request and credit user wallet (Admin only)
export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    const adminCheck = requireAdmin(request);
    if (adminCheck instanceof Response) return adminCheck;

    await dbConnect();

    const body = await request.json();
    const { requestId, approvedAmount } = body;

    if (!requestId || approvedAmount === undefined || approvedAmount < 0) {
      return NextResponse.json(
        { error: 'Request ID and valid approved amount are required' },
        { status: 400 }
      );
    }

    // Find the pending request
    const cashbackRequest = await WalletCashbackRequest.findById(requestId);
    
    if (!cashbackRequest) {
      return NextResponse.json(
        { error: 'Cashback request not found' },
        { status: 404 }
      );
    }

    if (cashbackRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    // Update the request status
    cashbackRequest.status = 'approved';
    cashbackRequest.approvedAmount = approvedAmount;
    cashbackRequest.approvedBy = user.userId;
    cashbackRequest.approvedAt = new Date();
    await cashbackRequest.save();

    // Credit the user's wallet
    if (approvedAmount > 0) {
      const userDoc = await User.findById(cashbackRequest.user);
      if (userDoc) {
        userDoc.walletBalance = (userDoc.walletBalance || 0) + approvedAmount;
        await userDoc.save();
        console.log(`✅ Admin approved wallet cashback: ₹${approvedAmount} credited to user ${cashbackRequest.user}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Wallet cashback of ₹${approvedAmount} approved and credited`,
      request: cashbackRequest,
    });
  } catch (error) {
    console.error('Approve cashback request error:', error);
    return NextResponse.json(
      { error: 'Failed to approve cashback request' },
      { status: 500 }
    );
  }
}

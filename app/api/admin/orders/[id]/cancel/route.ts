import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import razorpay from '@/lib/razorpay';
import { requireAdmin } from '@/lib/auth'; // Ensure this exists or use requireAuth and check role

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    const { id } = await context.params;
    const body = await request.json();
    const { action, refundAmount } = body; // action: 'approve' | 'reject'

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (['Cancelled', 'Delivered', 'Out for Delivery'].includes(order.orderStatus)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage (Delivered or Out for Delivery)' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
        let approvedRefund = Number(refundAmount) || 0;

        // COD check: If COD, refund amount must be 0
        if (order.paymentMethod === 'COD') {
            approvedRefund = 0;
        }

        const paidOnline = order.paymentMethod === 'Online' ? order.totalAmount : 0;
        let onlineRefunded = 0;
        // Remaining refund logic removed as we are strictly manual everything now.

        // Wallet Refund Logic
        let walletRefunded = 0;
        const walletAmountToRefund = Number(body.walletRefundAmount) || 0;
        
        if (walletAmountToRefund > 0 && order.user) {
            try {
                const userDoc = await User.findById(order.user);
                if (userDoc) {
                    userDoc.walletBalance = (userDoc.walletBalance || 0) + walletAmountToRefund;
                    await userDoc.save();
                    walletRefunded = walletAmountToRefund;
                    console.log(`💰 Admin manually refunded ₹${walletRefunded} to wallet for user ${userDoc._id}`);
                }
            } catch (err) {
                console.error("Failed to process wallet refund:", err);
            }
        }
        
        order.orderStatus = 'Cancelled';
        order.cancellationRequest = {
            ...order.cancellationRequest,
            status: 'Approved',
            refundAmount: approvedRefund,
            adminNote: order.paymentMethod === 'COD' 
                ? `Cancelled. COD Order. Wallet Refund: ₹${walletRefunded}` 
                : `Approved. Refund Amount: ₹${approvedRefund}. Wallet Refund: ₹${walletRefunded}. MANUAL REFUND REQUIRED for Online Payment.`,
            processedAt: new Date()
        };
        
        await order.save();
        
        return NextResponse.json({ success: true, message: 'Cancellation approved & refunded' });

    } else if (action === 'reject') {
        order.cancellationRequest = {
            ...order.cancellationRequest,
            status: 'Rejected',
            adminNote: 'Admin rejected cancellation request.',
            processedAt: new Date()
        };
        // Status remains 'preparing your cake' (or whatever it was)
        await order.save();
        return NextResponse.json({ success: true, message: 'Cancellation rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Admin Cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

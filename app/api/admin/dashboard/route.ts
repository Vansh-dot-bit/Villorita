import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ─── Base Metrics ────────────────────────────────────────────────────────
    // grossRevenue = total amount paid by customers (subtotal - discounts + delivery)
    const getOrderMetrics = async (matchCriteria: any) => {
      const baseMetrics = await Order.aggregate([
        { $match: { paymentStatus: 'Paid', ...matchCriteria } },
        {
          $group: {
            _id: null,
            grossRevenue:  { $sum: '$totalAmount' },
            delivery:      { $sum: '$deliveryCharge' },
            coupons:       { $sum: '$discount' },
            wallet:        { $sum: '$walletUsed' },
            addonsTotal: {
              $sum: {
                $reduce: {
                  input: { $ifNull: ['$addons', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', { $multiply: ['$$this.price', { $ifNull: ['$$this.quantity', 1] }] }] }
                }
              }
            }
          },
        },
      ]);

      const refundMetrics = await Order.aggregate([
        {
          $match: {
            'cancellationRequest.status': 'Approved',
            ...matchCriteria,
          },
        },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: '$cancellationRequest.refundAmount' },
          },
        },
      ]);

      const base    = baseMetrics[0]   || { grossRevenue: 0, delivery: 0, coupons: 0, wallet: 0, addonsTotal: 0 };
      const refunds = refundMetrics[0] || { totalRefunds: 0 };
      return { ...base, ...refunds };
    };

    // ─── Vendor Revenue (Percent-Cut Model) ──────────────────────────────────
    // For each sold item:
    //   • Look up the store via the order's storeId field.
    //   • platform revenue  = item.price × qty × (adminCutPercentage / 100)
    //   • vendor  revenue   = item.price × qty × (1 - adminCutPercentage / 100)
    // If no store found (admin-direct product) → adminCutPercentage defaults to 100
    //   meaning 100 % goes to platform and 0 % to vendor.
    const getRevenueBreakdown = async (matchCriteria: any) => {
      return Order.aggregate([
        { $match: { paymentStatus: 'Paid', ...matchCriteria } },
        { $unwind: '$items' },
        {
          // Join on storeId stored directly on the order document
          $lookup: {
            from:         'stores',
            localField:   'storeId',
            foreignField: '_id',
            as:           'storeDetails',
          },
        },
        {
          $unwind: { path: '$storeDetails', preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            // Use the store's adminCutPercentage; default to 100 if no store (admin product)
            adminCutPct:  { $ifNull: ['$storeDetails.adminCutPercentage', 100] },
            itemRevenue:  { $multiply: ['$items.price', '$items.quantity'] },
          },
        },
        {
          $project: {
            platformShare: {
              $multiply: [
                '$itemRevenue',
                { $divide: ['$adminCutPct', 100] },
              ],
            },
            vendorShare: {
              $multiply: [
                '$itemRevenue',
                { $divide: [{ $subtract: [100, '$adminCutPct'] }, 100] },
              ],
            },
          },
        },
        {
          $group: {
            _id:                null,
            totalPlatformShare: { $sum: '$platformShare' },
            totalVendorShare:   { $sum: '$vendorShare' },
          },
        },
      ]);
    };

    // ─── Parallel Execution ───────────────────────────────────────────────────
    const [
      lifetimeMetrics,  lifetimeBreakdown,
      monthlyMetrics,   monthlyBreakdown,
      weeklyMetrics,    weeklyBreakdown,
      recentOrders,
      codMetrics,
      codOrdersList,
    ] = await Promise.all([
      getOrderMetrics({}),
      getRevenueBreakdown({}),
      getOrderMetrics({ createdAt: { $gte: firstDayOfMonth } }),
      getRevenueBreakdown({ createdAt: { $gte: firstDayOfMonth } }),
      getOrderMetrics({ createdAt: { $gte: sevenDaysAgo } }),
      getRevenueBreakdown({ createdAt: { $gte: sevenDaysAgo } }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      // COD Delivered but not yet collected
      Order.aggregate([
        {
          $match: {
            paymentMethod: 'COD',
            orderStatus:   'Delivered',
            paymentStatus: { $ne: 'Paid' },
          },
        },
        {
          $group: {
            _id:         null,
            totalAmount: { $sum: '$totalAmount' },
            count:       { $sum: 1 },
          },
        },
      ]),
      Order.find({
        paymentMethod: 'COD',
        orderStatus:   'Delivered',
        paymentStatus: { $ne: 'Paid' },
      })
        .sort({ createdAt: -1 })
        .populate('user', 'name email')
        .limit(20),
    ]);

    // ─── Extract Helper ───────────────────────────────────────────────────────
    const extract = (metrics: any, breakdown: any[]) => {
      const m = metrics || { grossRevenue: 0, delivery: 0, coupons: 0, wallet: 0, totalRefunds: 0, addonsTotal: 0 };
      const b = breakdown[0] || { totalPlatformShare: 0, totalVendorShare: 0 };

      const grossRevenue    = m.grossRevenue;
      const refunds         = m.totalRefunds;
      const delivery        = m.delivery;
      const coupons         = m.coupons;
      const wallet          = m.wallet;
      const addonsTotal     = m.addonsTotal || 0;

      // Platform's cut from product sales (based on per-store adminCutPercentage)
      const platformRevenue = b.totalPlatformShare;
      // What vendors receive from product sales
      const vendorRevenue   = b.totalVendorShare;

      // Net Profit = what the platform keeps after paying vendors
      // (platformRevenue + delivery income + addons income) - refunds - coupons - wallet adjustments
      const netProfit = platformRevenue + delivery + addonsTotal - refunds - coupons - wallet;

      return {
        grossRevenue,
        platformRevenue,
        vendorRevenue,
        addonsTotal,
        delivery,
        coupons,
        wallet,
        refunds,
        netProfit,
      };
    };

    const lifetime = extract(lifetimeMetrics, lifetimeBreakdown);
    const monthly  = extract(monthlyMetrics,  monthlyBreakdown);
    const weekly   = extract(weeklyMetrics,   weeklyBreakdown);

    const codData = codMetrics[0] || { totalAmount: 0, count: 0 };

    return NextResponse.json({
      success: true,
      lifetime,
      monthly,
      weekly,
      codData,
      codOrders:    JSON.parse(JSON.stringify(codOrdersList)),
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DeliverySettings from '@/models/DeliverySettings';
import { requireAdmin } from '@/lib/auth';

// GET – public, returns the single delivery settings document (or null)
export async function GET() {
  try {
    await dbConnect();
    const settings = await DeliverySettings.findOne();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('[delivery-settings GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery settings' },
      { status: 500 }
    );
  }
}

// PUT – admin only, upserts the single settings document
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = requireAdmin(request);
    if (adminCheck instanceof Response) return adminCheck;

    await dbConnect();

    const body = await request.json();
    const {
      baseFee,
      perKmCharge,
      highDemandSurcharge,
      extraFee,
      extraFeeLabel,
      isActive,
    } = body;

    // Build update object – only include fields that were explicitly sent
    // (so un-sent optional fields won't overwrite existing values)
    const updateFields: Record<string, any> = {};

    if (isActive !== undefined) updateFields.isActive = isActive;
    
    // For number fields: if sent as empty string or null, unset them; 
    // otherwise save the number value.
    const numberFields = ['baseFee', 'perKmCharge', 'highDemandSurcharge', 'extraFee'] as const;
    const $unset: Record<string, 1> = {};

    for (const field of numberFields) {
      const val = body[field];
      if (val === '' || val === null) {
        $unset[field] = 1;
      } else if (val !== undefined) {
        updateFields[field] = Number(val);
      }
    }

    if (extraFeeLabel === '' || extraFeeLabel === null) {
      $unset.extraFeeLabel = 1;
    } else if (extraFeeLabel !== undefined) {
      updateFields.extraFeeLabel = extraFeeLabel;
    }

    const updateQuery: Record<string, any> = { $set: updateFields };
    if (Object.keys($unset).length > 0) updateQuery.$unset = $unset;

    const settings = await DeliverySettings.findOneAndUpdate(
      {},
      updateQuery,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('[delivery-settings PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update delivery settings' },
      { status: 500 }
    );
  }
}

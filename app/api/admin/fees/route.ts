import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Fee from '@/models/Fee';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Return all fees so admin can see active and inactive ones
    const fees = await Fee.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      fees
    });
  } catch (error) {
    console.error('Error fetching fees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    const body = await request.json();
    
    // Basic validation
    if (!body.name || !body.type || !body.description || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required configuration fields for this fee.' },
        { status: 400 }
      );
    }

    if (body.type === 'tax' && (!body.applicableOn || body.applicableOn.length === 0)) {
        return NextResponse.json(
          { error: 'Taxes must specify which price components they are applicable on.' },
          { status: 400 }
        );
    }
    
    if (body.type === 'charge' && body.applicableOn?.length > 0) {
       body.applicableOn = []; // Flat charges don't apply to specific components
    }

    const newFee = await Fee.create(body);

    return NextResponse.json({
      success: true,
      message: 'Fee created successfully',
      fee: newFee
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating fee:', error);
    return NextResponse.json(
      { error: 'Failed to create fee' },
      { status: 500 }
    );
  }
}

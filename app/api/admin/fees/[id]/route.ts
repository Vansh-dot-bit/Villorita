import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Fee from '@/models/Fee';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    const resolvedParams = await params;
    const body = await request.json();

    await dbConnect();

    // If we're toggling isActive or updating the fee configuration
    // Verify type safety on applicableOn
    if (body.type === 'tax' && ('applicableOn' in body) && (!body.applicableOn || body.applicableOn.length === 0)) {
        return NextResponse.json(
          { error: 'Taxes must specify at least one price component they are applicable on (e.g., Subtotal).' },
          { status: 400 }
        );
    }
    if (body.type === 'charge') {
        body.applicableOn = []; // enforce empty for simple charges
    }

    const fee = await Fee.findByIdAndUpdate(
      resolvedParams.id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!fee) {
      return NextResponse.json(
        { error: 'Fee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fee updated successfully',
      fee
    });
  } catch (error) {
    console.error('Error updating fee:', error);
    return NextResponse.json(
      { error: 'Failed to update fee' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    const resolvedParams = await params;
    await dbConnect();

    const result = await Fee.findByIdAndDelete(resolvedParams.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Fee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Fee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fee:', error);
    return NextResponse.json(
      { error: 'Failed to delete fee' },
      { status: 500 }
    );
  }
}

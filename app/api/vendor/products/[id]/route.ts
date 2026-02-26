import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireVendor } from '@/lib/auth';
import { getStoreByVendorId } from '@/lib/stores';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireVendor(request);
    if (user instanceof NextResponse) return user;

    await dbConnect();
    const vendorId = (user as any).userId;
    const store = await getStoreByVendorId(vendorId);

    if (!store) {
      return NextResponse.json({ error: 'You do not have an assigned store yet.' }, { status: 403 });
    }

    const resolvedParams = await params;

    // Verify product belongs to store
    const existing = await Product.findOne({ _id: resolvedParams.id, storeId: store.id });
    if (!existing) {
        return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 404 });
    }

    const body = await request.json();
    body.storeId = store.id; // ensure storeId cannot be changed

    if (body.weights && body.weights.length > 0) {
        body.price = body.weights[0].price || 0;
        body.costPrice = body.weights[0].costPrice || 0;
    }

    const product = await Product.findByIdAndUpdate(resolvedParams.id, body, { new: true });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error updating vendor product:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireVendor(request);
    if (user instanceof NextResponse) return user;

    await dbConnect();
    const vendorId = (user as any).userId;
    const store = await getStoreByVendorId(vendorId);

    if (!store) {
      return NextResponse.json({ error: 'You do not have an assigned store yet.' }, { status: 403 });
    }

    const resolvedParams = await params;

    // Verify product belongs to store
    const existing = await Product.findOneAndDelete({ _id: resolvedParams.id, storeId: store.id });
    if (!existing) {
        return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vendor product:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}

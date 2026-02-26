import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireVendor } from '@/lib/auth';
import { getStoreByVendorId } from '@/lib/stores';

export async function GET(request: NextRequest) {
  try {
    const user = requireVendor(request);
    if (user instanceof NextResponse) return user;

    await dbConnect();
    const vendorId = (user as any).userId;
    const store = await getStoreByVendorId(vendorId);

    if (!store) {
      return NextResponse.json({ success: true, products: [], message: 'No store assigned yet.' });
    }

    const products = await Product.find({ storeId: store.id }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, products, store });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vendor products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireVendor(request);
    if (user instanceof NextResponse) return user;

    await dbConnect();
    const vendorId = (user as any).userId;
    const store = await getStoreByVendorId(vendorId);

    if (!store) {
      return NextResponse.json({ error: 'You do not have an assigned store yet.' }, { status: 403 });
    }

    const body = await request.json();
    body.storeId = store.id;

    if (body.weights && body.weights.length > 0) {
        body.price = body.weights[0].price || 0;
    }

    const product = await Product.create(body);

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vendor product:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

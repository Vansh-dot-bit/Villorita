import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Store from '@/models/Store';
import Product from '@/models/Product';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;

    const storeId = resolvedParams.storeId;

    // Fetch store
    const store = await Store.findById(storeId);
    
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Fetch categories for this store
    const categories = await Category.find({ storeId }).sort({ createdAt: -1 });

    // Fetch products and combos for this store
    const products = await Product.find({ storeId, isActive: true, isAvailable: true }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      store,
      categories,
      products
    });
  } catch (error) {
    console.error('Error fetching store details:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch store details' }, { status: 500 });
  }
}

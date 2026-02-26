import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth';

// GET all products with optional filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query: any = { isActive: true };
    
    // Allow filtering by availability if needed, but default to showing all active products
    // The frontend filtering for "user view" happens in the component or via a specific param if we want.
    // However, the issue might be that the API returns everything and we filter on client?
    // Let's ensure isAvailable is in the response. It is part of the document.

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user; // Return error response if not admin

    await dbConnect();

    const body = await request.json();
    const { name, description, price, category, image, features, weights } = body;

    // Validation
    if (!name || !description || !price || !category || !image) {
      return NextResponse.json(
        { error: 'Please provide all required fields: name, description, price, category, image' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      features: features || {},
      weights: weights || [],
      images: body.images || [],
      stock: body.stock || 0,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

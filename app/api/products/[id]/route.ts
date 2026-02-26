import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

// GET single product by ID
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const params = await props.params;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update product (Admin only)
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const params = await props.params;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const product = await Product.findByIdAndUpdate(
      id,
      { ...body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (Admin only)
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const user = requireAdmin(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const params = await props.params;
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

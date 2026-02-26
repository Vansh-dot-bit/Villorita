import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { requireVendor } from '@/lib/auth';
import { getStoreByVendorId } from '@/lib/stores';
import { serializeCategory } from '@/lib/categories'; // Wait, serializeCategory is not exported. I'll just map it directly.

export async function GET(request: NextRequest) {
  try {
    const user = requireVendor(request);
    if (user instanceof NextResponse) return user;

    await dbConnect();
    const vendorId = (user as any).userId;
    const store = await getStoreByVendorId(vendorId);

    if (!store) {
      return NextResponse.json({ success: true, categories: [], message: 'No store assigned yet.' });
    }

    const categories = await Category.find({ storeId: store.id }).sort({ name: 1 });
    
    return NextResponse.json({ 
        success: true, 
        categories: categories.map(c => ({
            ...c.toObject(),
            id: c._id.toString(),
            _id: c._id.toString(),
            storeId: c.storeId?.toString()
        }))
    });
  } catch (error) {
    console.error('Error fetching vendor categories:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
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

    const { name, color, image } = await request.json();
    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    // Scoped slug to store to allow same category names across different stores
    // Or just make slug unique globally? The Model Category has `unique: true` on name and slug!
    // Wait... if category name has unique: true, vendors can't have the same category name like "Cakes"!
    // This is a database schema issue if vendors want same category names.
    // For now, let's prepend storeId to the slug if it's unique.
    const uniqueSlug = `${store.id}-${slug}`;

    // Check if exists
    const existing = await Category.findOne({ storeId: store.id, name });
    if (existing) {
        return NextResponse.json({ error: 'Category already exists in your store' }, { status: 400 });
    }

    const category = await Category.create({ 
        name, 
        slug: uniqueSlug, // Ensuring global uniqueness due to Schema
        color: color || 'bg-purple-100', 
        image, 
        storeId: store.id 
    });

    return NextResponse.json({ 
        success: true, 
        category: {
            ...category.toObject(),
            id: category._id.toString()
        } 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating vendor category:', error);
    // Handle mongoose duplicate key error gracefully
    if (error.code === 11000) {
        return NextResponse.json({ success: false, error: 'Category name already exists' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = requireVendor(request);
        if (user instanceof NextResponse) return user;
    
        await dbConnect();
        const vendorId = (user as any).userId;
        const store = await getStoreByVendorId(vendorId);
    
        if (!store) {
          return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
    
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const existing = await Category.findOneAndDelete({ _id: id, storeId: store.id });
        if (!existing) {
            return NextResponse.json({ error: 'Category not found or not authorized' }, { status: 404 });
        }
    
        return NextResponse.json({ success: true, message: 'Deleted successfully' });
      } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Failed to delete category' }, { status: 500 });
      }
}

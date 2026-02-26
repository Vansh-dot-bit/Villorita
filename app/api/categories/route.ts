import { NextResponse } from 'next/server';
import { getCategories, getCategoriesAll, addCategory, deleteCategory } from '@/lib/categories';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');

    // Admin can request all categories (including store-linked ones)
    if (all === 'true') {
      const user = requireAdmin(request);
      if (user instanceof Response) return user;
      const categories = await getCategoriesAll();
      return NextResponse.json({ success: true, categories });
    }

    // Public: return only global categories (no storeId)
    const categories = await getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const user = requireAdmin(request);
        if (user instanceof Response) return user;

        const body = await request.json();
        const { name, color, image, storeId } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const category = await addCategory(name, color, image, storeId || undefined);
        return NextResponse.json({ success: true, category });
    } catch (error: any) {
        console.error('Add Category Error:', error);
        if (error.message === 'Category already exists' || error.code === 11000) {
             return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = requireAdmin(request);
        if (user instanceof Response) return user;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await deleteCategory(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireAuth, requireAdmin } from '@/lib/auth';

// GET - Fetch all active banners (Public)
// OR Fetch all banners if Admin
export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Check if admin is requesting to show all (including inactive)
    // For simplicity in this implementation, we'll fetch all and filter on frontend for admin,
    // or just fetch active for public. 
    // Let's check query param "admin=true" if we want to secure it, but for public endpoint usually
    // we return active. 
    // Let's verify auth to decide.
    
    // Simple approach: Return all, let frontend filter? 
    // No, public should only see active.
    
    // Let's stick to standard practice: 
    // If authenticated admin -> return all
    // Else -> return active only
    
    // BUT middleware might not parse token in simple GET. 
    // Let's use a query param `type=all` and check auth.
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'all') {
         // Verify admin
        const admin = requireAdmin(request);
        if (admin instanceof Response) return admin;
        
        const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
        return NextResponse.json({ success: true, banners });
    }

    // Public fetch
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ success: true, banners });

  } catch (error) {
    console.error('Fetch banners error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

// POST - Create new banner (Admin)
export async function POST(request: Request) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();

    const body = await request.json();
    
    // Basic validation
    if (!body.image && !body.gradient && !body.title) {
        return NextResponse.json(
            { error: 'Provide at least an image, a gradient, or a title' },
            { status: 400 }
        );
    }

    const banner = await Banner.create(body);

    return NextResponse.json({
      success: true,
      message: 'Banner created successfully',
      banner,
    }, { status: 201 });

  } catch (error) {
    console.error('Create banner error:', error);
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}

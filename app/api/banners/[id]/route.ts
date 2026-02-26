import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Banner from '@/models/Banner';
import { requireAuth, requireAdmin } from '@/lib/auth';

// PUT - Update banner (Admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const banner = await Banner.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Banner updated successfully',
      banner,
    });

  } catch (error) {
    console.error('Update banner error:', error);
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    );
  }
}

// DELETE - Delete banner (Admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();

    const { id } = await params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully',
    });

  } catch (error) {
    console.error('Delete banner error:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}

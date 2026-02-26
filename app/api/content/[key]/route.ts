import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Content from '@/models/Content';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    await dbConnect();
    const { key } = await params;
    
    // Check if key is valid to prevent arbitrary queries
    const validKeys = ['about', 'terms', 'privacy', 'support', 'faq'];
    if (!validKeys.includes(key)) {
        return NextResponse.json({ error: 'Invalid content key' }, { status: 400 });
    }

    let content = await Content.findOne({ key });
    
    // Return default empty content if not found (so manual DB seeding isn't strictly required)
    if (!content) {
        return NextResponse.json({ 
            success: true, 
            data: { key, title: '', content: '' } 
        });
    }

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Fetch content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    const { key } = await params;
    const body = await request.json();
    const { title, content, meta } = body;

    const updatedContent = await Content.findOneAndUpdate(
      { key },
      { title, content, meta, lastUpdated: new Date() },
      { new: true, upsert: true } // Create if doesn't exist
    );

    return NextResponse.json({ success: true, data: updatedContent });
  } catch (error) {
    console.error('Update content error:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

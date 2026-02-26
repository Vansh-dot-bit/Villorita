import { NextResponse } from 'next/server';
import { getSections, createSection, updateSection, deleteSection } from '@/lib/sections';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const sections = await getSections();
    return NextResponse.json({ success: true, sections });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const user = requireAdmin(request);
        if (user instanceof Response) return user;

        const body = await request.json();
        const section = await createSection(body);
        return NextResponse.json({ success: true, section });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create section' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user = requireAdmin(request);
        if (user instanceof Response) return user;

        const body = await request.json();
        const { id, ...data } = body;
        
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const section = await updateSection(id, data);
        return NextResponse.json({ success: true, section });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update section' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = requireAdmin(request);
        if (user instanceof Response) return user;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await deleteSection(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
    }
}

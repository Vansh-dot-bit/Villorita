import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import PartnerApplication from '@/models/PartnerApplication';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch current user's application
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const application = await PartnerApplication.findOne({ userId: user.userId }).lean();

    return NextResponse.json({ success: true, application: application || null });
  } catch (error) {
    console.error('Get partner application error:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

// POST - Submit a new application (or update existing pending one)
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    // Check if user already has a non-rejected application
    const existing = await PartnerApplication.findOne({ userId: user.userId });
    if (existing && existing.status !== 'rejected') {
      return NextResponse.json(
        { error: 'You already have an active application.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Description is required
    const description = formData.get('description') as string;
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    // Helper to upload PDF
    const uploadPdf = async (file: File | null, name: string): Promise<string | undefined> => {
      if (!file || file.size === 0) return undefined;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'partner-docs');
      await mkdir(uploadDir, { recursive: true });
      const filename = `${user.userId}-${name}-${Date.now()}.pdf`;
      const bytes = await file.arrayBuffer();
      await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
      return `/uploads/partner-docs/${filename}`;
    };

    const fssaiFile = formData.get('fssaiDoc') as File | null;
    const gstinFile = formData.get('gstinDoc') as File | null;
    const panFile = formData.get('panDoc') as File | null;

    const [fssaiDocUrl, gstinDocUrl, panDocUrl] = await Promise.all([
      uploadPdf(fssaiFile, 'fssai'),
      uploadPdf(gstinFile, 'gstin'),
      uploadPdf(panFile, 'pan'),
    ]);

    const applicationData: any = {
      userId: user.userId,
      description: description.trim(),
      status: 'pending',
    };

    // Collect optional fields
    const fields = [
      'bakeryName', 'address', 'preparationTime', 'openHour', 'openPeriod',
      'closeHour', 'closePeriod', 'ownerName', 'ownerPhone', 'ownerEmail',
      'fssaiNumber', 'gstin', 'panCard', 'bankName', 'accountHolderName',
      'ifscCode', 'accountType',
    ];
    for (const field of fields) {
      const val = formData.get(field);
      if (val && (val as string).trim()) {
        applicationData[field] = (val as string).trim();
      }
    }

    if (fssaiDocUrl) applicationData.fssaiDocUrl = fssaiDocUrl;
    if (gstinDocUrl) applicationData.gstinDocUrl = gstinDocUrl;
    if (panDocUrl) applicationData.panDocUrl = panDocUrl;

    let application;
    if (existing && existing.status === 'rejected') {
      // Allow resubmission if rejected
      Object.assign(existing, applicationData);
      application = await existing.save();
    } else {
      application = await PartnerApplication.create(applicationData);
    }

    return NextResponse.json(
      { success: true, message: 'Application submitted successfully!', application },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit partner application error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

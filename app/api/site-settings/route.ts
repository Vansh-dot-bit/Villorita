import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SiteSettings from '@/models/SiteSettings';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await dbConnect();
    let settings = await SiteSettings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await SiteSettings.create({
        isComingSoon: false,
        comingSoonMessage: 'We are currently working on something amazing. Please check back later!',
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Get site settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Ensure admin checks
    const admin = requireAdmin(request);
    if (admin instanceof Response) return admin;

    await dbConnect();
    const body = await request.json();
    const { isComingSoon, comingSoonMessage } = body;

    let settings = await SiteSettings.findOne();
    
    if (!settings) {
      settings = new SiteSettings();
    }

    if (isComingSoon !== undefined) settings.isComingSoon = isComingSoon;
    if (comingSoonMessage !== undefined) settings.comingSoonMessage = comingSoonMessage;
    // @ts-ignore
    settings.lastUpdatedBy = admin.userId;

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Site settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Update site settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
}

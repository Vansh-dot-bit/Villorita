import { NextResponse } from 'next/server';

/**
 * This route previously served files from the local `public/uploads/` directory.
 * All file uploads now go to Cloudinary (which returns full https:// URLs),
 * so this route is no longer used for new uploads.
 *
 * It's kept here as a 404 stub so that any stale references don't cause
 * unhandled 500 errors.
 */
export async function GET() {
  return new NextResponse(
    'File not found. All uploaded files are now served directly from Cloudinary.',
    { status: 404 }
  );
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  
  if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Path required', { status: 400 });
  }

  let cleanPath = pathSegments.join(path.sep).replace(/\.\./g, '');
  
  // Define the root of your uploads folder (usually public/uploads)
  let imagesDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(imagesDir)) {
      // Fallback to public folder directly if uploads doesn't exist
      imagesDir = path.join(process.cwd(), 'public');
  }
  
  let filePath = path.join(imagesDir, cleanPath);

  // Smart Path Correction:
  if (!fs.existsSync(filePath)) {
      // Try to find if the path was intended for 'public' in general
      const possibleFileName = cleanPath.replace(/^[\\/]+/, '');
      let retryPath = path.join(process.cwd(), 'public', possibleFileName);
      if (fs.existsSync(retryPath)) {
          console.log(`Smart corrected path from "${cleanPath}" to "${retryPath}"`);
          filePath = retryPath;
      }
  }

  console.log('--- Image API Debug ---');
  console.log('Requested Path:', cleanPath);
  console.log('Resolved File Path:', filePath);
  console.log('File Exists:', fs.existsSync(filePath));
  console.log('-----------------------');

  try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
      }

      // Check if it's a file and not a directory
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        return new NextResponse('Not a file', { status: 400 });
      }

      // Get file content
      const fileBuffer = fs.readFileSync(filePath);
      
      // Determine content type
      const contentType = mime.getType(filePath) || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
  } catch (error) {
      console.error('Error serving file:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
  }
}

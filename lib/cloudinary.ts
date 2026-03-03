import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer  - The file data as a Buffer
 * @param options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns The Cloudinary upload result (secure_url is the public HTTPS URL)
 */
export function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    public_id?: string;
    format?: string;
  } = {}
): Promise<{ secure_url: string; public_id: string; [key: string]: unknown }> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder: options.folder || 'pur-uploads',
      resource_type: options.resource_type || 'auto',
    };

    if (options.public_id) uploadOptions.public_id = options.public_id;
    if (options.format) uploadOptions.format = options.format;

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        reject(error || new Error('Cloudinary upload failed'));
      } else {
        resolve(result as { secure_url: string; public_id: string; [key: string]: unknown });
      }
    });

    stream.end(buffer);
  });
}

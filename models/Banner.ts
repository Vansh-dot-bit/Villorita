import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  description: string;
  code: string;
  cta: string;
  link: string;
  gradient: string;
  textColor: string;
  image?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    code: { type: String, default: '' },
    cta: { type: String, default: 'Shop Now' },
    link: { type: String, default: '/category/all' },
    gradient: { type: String },
    textColor: { type: String, default: 'text-white' },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Prevent Mongoose overwriting model error in development
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Banner;
}

export default mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

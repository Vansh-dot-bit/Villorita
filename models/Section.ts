import mongoose from 'mongoose';

const SectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Section title is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['grid', 'carousel'],
    default: 'grid',
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export interface ISection extends mongoose.Document {
  title: string;
  type: 'grid' | 'carousel';
  products: mongoose.Types.ObjectId[];
  isActive: boolean;
  order: number;
  createdAt: Date;
}

export default mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);

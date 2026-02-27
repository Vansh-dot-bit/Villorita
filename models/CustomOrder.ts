import mongoose, { Schema, Document } from 'mongoose';

interface ICustomOrderItem {
  flavor: string;
  size?: string;
  specialInstructions?: string;
}

export interface ICustomOrder extends Document {
  user: mongoose.Types.ObjectId;
  imageUrl: string;
  flavor: string;
  description: string;
  status: 'pending' | 'quoted' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  quotedPrice?: number;
  finalPrice?: number;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomOrderSchema = new Schema<ICustomOrder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: [true, 'Reference image is required'],
  },
  flavor: {
    type: String,
    required: [true, 'Flavor selection is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'quoted', 'approved', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  quotedPrice: {
    type: Number,
    min: 0,
  },
  finalPrice: {
    type: Number,
    min: 0,
  },
  adminNotes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
CustomOrderSchema.pre('save', function(next: any) {
  this.updatedAt = new Date();
  next();
});

export default (mongoose.models.CustomOrder as mongoose.Model<ICustomOrder>) || mongoose.model<ICustomOrder>('CustomOrder', CustomOrderSchema);

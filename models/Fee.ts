import mongoose, { Schema, Document } from 'mongoose';

export interface IFee extends Document {
  name: string;
  type: 'charge' | 'tax';
  description: string;
  value: number; // Flat amount for charge, percentage for tax
  applicableOn: string[]; // e.g. ['subtotal', 'addons', 'delivery']
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema = new Schema<IFee>({
  name: {
    type: String,
    required: [true, 'Fee name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['charge', 'tax'],
    required: [true, 'Fee type is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  value: {
    type: Number,
    required: [true, 'Fee value is required'],
    min: [0, 'Fee value cannot be negative'],
  },
  applicableOn: {
    type: [String],
    default: [], // Only used when type is 'tax'
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

// HMR cache-bust
if (mongoose.models.Fee) {
  delete mongoose.models.Fee;
}

export default (mongoose.models.Fee as mongoose.Model<IFee>) || mongoose.model<IFee>('Fee', FeeSchema);

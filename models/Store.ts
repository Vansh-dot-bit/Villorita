import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  photo?: string;
  address: string;
  km: number;
  opensAt: string;
  closesAt: string;
  isListedOnHome: boolean;
  isActive: boolean;
  adminCutPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>({
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  photo: {
    type: String,
  },
  address: {
    type: String,
    required: [true, 'Store address is required'],
    trim: true,
  },
  km: {
    type: Number,
    required: [true, 'Distance in km is required'],
    min: 0,
  },
  opensAt: {
    type: String,
    required: [true, 'Opening time is required'],
  },
  closesAt: {
    type: String,
    required: [true, 'Closing time is required'],
  },
  isListedOnHome: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  adminCutPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { timestamps: true });

export default (mongoose.models.Store as mongoose.Model<IStore>) || mongoose.model<IStore>('Store', StoreSchema);

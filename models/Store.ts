import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  photo?: string;
  address: string;
  lat?: number;
  lng?: number;
  opensAt: string;
  closesAt: string;
  isListedOnHome: boolean;
  isActive: boolean;
  rating?: number;
  deliveryTime?: string;
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
  lat: {
    type: Number,
  },
  lng: {
    type: Number,
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
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5,
  },
  adminCutPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  deliveryTime: {
    type: String,
    default: '',
  }
}, { timestamps: true });

// HMR cache-bust: recompile if schema is stale (missing new fields).
if (mongoose.models.Store) {
  const schema = mongoose.models.Store.schema;
  if (!schema.paths.rating || !schema.paths.lat) {
      delete mongoose.models.Store;
  }
}

export default (mongoose.models.Store as mongoose.Model<IStore>) || mongoose.model<IStore>('Store', StoreSchema);

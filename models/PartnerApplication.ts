import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerApplication extends Document {
  userId: mongoose.Types.ObjectId;

  // Section 1: Basic Information
  bakeryName?: string;
  address?: string;
  preparationTime?: string;
  openHour?: string;
  openPeriod?: 'AM' | 'PM';
  closeHour?: string;
  closePeriod?: 'AM' | 'PM';
  description: string; // Required

  // Section 2: Owner Details
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;

  // Section 3: Legalities
  fssaiNumber?: string;    // 14 digits
  gstin?: string;          // 15 characters
  panCard?: string;
  fssaiDocUrl?: string;    // PDF path
  gstinDocUrl?: string;    // PDF path
  panDocUrl?: string;      // PDF path

  // Section 4: Bank Details
  bankName?: string;
  accountHolderName?: string;
  ifscCode?: string;
  accountType?: 'savings' | 'current';

  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const PartnerApplicationSchema = new Schema<IPartnerApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Section 1: Basic Information
    bakeryName: { type: String, trim: true },
    address: { type: String, trim: true },
    preparationTime: { type: String, trim: true },
    openHour: { type: String },
    openPeriod: { type: String, enum: ['AM', 'PM'] },
    closeHour: { type: String },
    closePeriod: { type: String, enum: ['AM', 'PM'] },
    description: { type: String, required: [true, 'Description is required'], trim: true },

    // Section 2: Owner Details
    ownerName: { type: String, trim: true },
    ownerPhone: { type: String, trim: true },
    ownerEmail: { type: String, trim: true, lowercase: true },

    // Section 3: Legalities
    fssaiNumber: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || v.length === 14,
        message: 'FSSAI license number must be 14 digits',
      },
    },
    gstin: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || v.length === 15,
        message: 'GSTIN must be 15 characters',
      },
    },
    panCard: { type: String, trim: true, uppercase: true },
    fssaiDocUrl: { type: String },
    gstinDocUrl: { type: String },
    panDocUrl: { type: String },

    // Section 4: Bank Details
    bankName: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    accountType: { type: String, enum: ['savings', 'current'] },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default (mongoose.models.PartnerApplication as mongoose.Model<IPartnerApplication>) ||
  mongoose.model<IPartnerApplication>('PartnerApplication', PartnerApplicationSchema);

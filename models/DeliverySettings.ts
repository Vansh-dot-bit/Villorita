import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliverySettings extends Document {
  baseFee?: number;
  perKmCharge?: number;
  highDemandSurcharge?: number;
  extraFee?: number;
  extraFeeLabel?: string;
  isActive: boolean;
}

const DeliverySettingsSchema = new Schema<IDeliverySettings>(
  {
    baseFee: {
      type: Number,
      min: 0,
    },
    perKmCharge: {
      type: Number,
      min: 0,
    },
    highDemandSurcharge: {
      type: Number,
      min: 0,
    },
    extraFee: {
      type: Number,
      min: 0,
    },
    extraFeeLabel: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Force model refresh on HMR
if (mongoose.models.DeliverySettings) {
  delete mongoose.models.DeliverySettings;
}

export default mongoose.model<IDeliverySettings>(
  'DeliverySettings',
  DeliverySettingsSchema
);

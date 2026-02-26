import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'wallet'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  maxDiscount: {
    type: Number, // For percentage type
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: null, // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  usageLimitPerUser: {
    type: Number,
    default: null, // null means unlimited per user
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Delete the model if it exists to avoid caching issues
if (mongoose.models.Coupon) {
  delete mongoose.models.Coupon;
}

export default mongoose.model('Coupon', CouponSchema);

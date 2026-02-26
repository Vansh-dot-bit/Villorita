import mongoose from 'mongoose';

const WalletCashbackRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  approvedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  couponCode: {
    type: String,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
  },
});

export default mongoose.models.WalletCashbackRequest || mongoose.model('WalletCashbackRequest', WalletCashbackRequestSchema);

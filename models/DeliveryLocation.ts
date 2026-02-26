import mongoose from 'mongoose';

const DeliveryLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    unique: true,
  },
  fee: {
    type: Number,
    required: [true, 'Delivery fee is required'],
    min: 0,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const DeliveryLocation = mongoose.models.DeliveryLocation || mongoose.model('DeliveryLocation', DeliveryLocationSchema);

export default DeliveryLocation;

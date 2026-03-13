import mongoose from 'mongoose';

const DeliveryLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const DeliveryLocation = mongoose.models.DeliveryLocation || mongoose.model('DeliveryLocation', DeliveryLocationSchema);

export default DeliveryLocation;

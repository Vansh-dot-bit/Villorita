import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deliveryAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
  storeSnapshot: {
    name: { type: String },
    address: { type: String },
    phone: { type: String },
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: String,
    price: Number,
    image: String,
    quantity: Number,
    weight: String,
  }],
  addons: [{
    addon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AddOn',
    },
    name: String,
    price: Number,
    quantity: Number,
  }],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  subtotal: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  couponCode: {
    type: String,
  },
  deliveryCharge: {
    type: Number,
    default: 0,
  },
  walletUsed: {
    type: Number,
    default: 0,
  },
  walletCashback: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Online', 'UPI'],
    default: 'COD',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending',
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'punched', 'preparing your cake', 'Confirmed', 'Processing', 'Awaiting Agent', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  otp: {
    type: String,
  },
  occasion: {
    type: String,
  },
  occasionName: {
    type: String,
  },
  cakeMessage: {
    type: String,
  },
  deliveryDate: {
    type: Date,
  },
  orderNotes: {
    type: String,
  },
  paymentDetails: {
    razorpay_payment_id: String,
    razorpay_order_id: String,
    razorpay_signature: String,
  },
  cancellationRequest: {
    reason: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      // Removed default: 'Pending' to prevent auto-creation
    },
    refundAmount: Number,
    requestedAt: {
      type: Date,
    },
    processedAt: {
      type: Date,
    },
    adminNote: String,
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

if (mongoose.models.Order) {
    delete mongoose.models.Order;
}

export default mongoose.model('Order', OrderSchema);

import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: String,
  price: Number,
  image: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  weight: {
    type: String,
    default: '1kg',
  },
  selectedPrice: {
    type: Number,
    required: true,
  },
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [CartItemSchema],
  addons: [{
    addon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AddOn',
      required: true,
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    }
  }],
  totalAmount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total amount before saving
CartSchema.pre('save', async function() {
  let itemsTotal = 0;
  if (this.items) {
      itemsTotal = this.items.reduce((total, item) => {
        return total + ((item.selectedPrice || item.price || 0) * (item.quantity || 1));
      }, 0);
  }
  let addonsTotal = 0;
  if (this.addons) {
      addonsTotal = this.addons.reduce((total, addon) => {
        return total + ((addon.price || 0) * (addon.quantity || 1));
      }, 0);
  }
  this.totalAmount = itemsTotal + addonsTotal;
  this.updatedAt = new Date();
});

// Delete the cached model to force recompilation during Next.js Hot Reload
if (mongoose.models.Cart) {
    delete mongoose.models.Cart;
}
export default mongoose.model('Cart', CartSchema);

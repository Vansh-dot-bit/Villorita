import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  type: {
    type: String,
    default: 'Contains Egg',
  },

  image: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  images: [{
    type: String,
  }],
  features: {
    eggless: {
      type: Boolean,
      default: false,
    },
    sugarFree: {
      type: Boolean,
      default: false,
    },
    vegan: {
      type: Boolean,
      default: false,
    },
  },
  weights: [{
    weight: String,
    price: Number,
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: String,
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  stock: {
    type: Number,
    default: 0,
  },
  preparingTime: {
    type: Number,
    default: 60,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isCombo: {
    type: Boolean,
    default: false,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },

}, { timestamps: true });

export interface IProduct extends mongoose.Document {
  name: string;
  description: string;
  price: number;
  category: string;

  image: string;
  images: string[];
  features: {
    eggless: boolean;
    sugarFree: boolean;
    vegan: boolean;
  };
  weights: {
    weight: string;
    price: number;
  }[];
  rating: {
    average: number;
    count: number;
  };
  reviews: {
    user: mongoose.Types.ObjectId;
    name: string;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];
  stock: number;
  preparingTime: number;
  isActive: boolean;
  isAvailable: boolean;
  isCombo?: boolean;
  storeId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  type?: string; 
}

// HMR cache-bust: recompile if schema is stale (missing new fields).
if (mongoose.models.Product) {
  const schema = mongoose.models.Product.schema;
  const hasOldCostPrice = !!schema.paths.costPrice;
  const missingPrepTime = !schema.paths.preparingTime;
  const missingType = !schema.paths.type;
  if (!schema.paths.isAvailable || !schema.paths.storeId || hasOldCostPrice || missingPrepTime || missingType) {
      delete mongoose.models.Product;
  }
}

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

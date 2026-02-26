import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    lowercase: true,
    trim: true,
  },
  color: {
    type: String,
    default: 'bg-gray-100', // Default color class
  },
  image: {
    type: String, // URL to the image
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
  },
});

export interface ICategory extends mongoose.Document {
  name: string;
  slug: string;
  color: string;
  image?: string;
  storeId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

// Prevent Mongoose overwriting model error in development
if (mongoose.models.Category) {
  const schema = mongoose.models.Category.schema;
  if (!schema.paths.storeId) {
      delete mongoose.models.Category;
  }
}

const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

// Try to drop old unique indexes if they exist to avoid errors when vendors use same category names
if (mongoose.connection && mongoose.connection.readyState === 1) {
    Category.collection.dropIndex('name_1').catch(() => {});
    Category.collection.dropIndex('slug_1').catch(() => {});
}

export default Category;

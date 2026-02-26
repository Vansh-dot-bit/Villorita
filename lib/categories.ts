import dbConnect from '@/lib/mongodb';
import Category, { ICategory } from '@/models/Category';

function serializeCategory(category: any) {
  const obj = category.toObject ? category.toObject() : category;
  // storeId can be a plain ObjectId OR a populated Store document {_id, name}
  let storeId: string | undefined;
  if (obj.storeId) {
    storeId = obj.storeId._id ? obj.storeId._id.toString() : obj.storeId.toString();
  }
  return {
    ...obj,
    id: obj._id.toString(),
    _id: obj._id.toString(),
    createdAt: obj.createdAt instanceof Date ? obj.createdAt.toISOString() : obj.createdAt,
    storeId,
  };
}


export async function getCategories() {
  await dbConnect();
  // Fetch all categories (global + store-linked) for the public home page
  const categories = await Category.find({}).sort({ name: 1 });
  return categories.map(serializeCategory);
}

export async function getCategoriesAll() {
  await dbConnect();
  // Fetch ALL categories (global + store-linked) — for admin panel
  const categories = await Category.find({}).sort({ name: 1 }).populate('storeId', 'name');
  return categories.map(serializeCategory);
}

export async function getCategoriesByStore(storeId: string) {
  await dbConnect();
  const categories = await Category.find({ storeId }).sort({ name: 1 });
  return categories.map(serializeCategory);
}

export async function addCategory(name: string, color?: string, image?: string, storeId?: string) {
    await dbConnect();
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    // Check if exists
    const existing = await Category.findOne({ slug, storeId: storeId || { $exists: false } });
    if (existing) throw new Error('Category already exists');

    const category = await Category.create({ name, slug, color, image, storeId });
    return serializeCategory(category);
}

export async function deleteCategory(id: string) {
    await dbConnect();
    await Category.findByIdAndDelete(id);
    return true;
}

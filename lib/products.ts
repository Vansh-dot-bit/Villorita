import dbConnect from '@/lib/mongodb';
import Product, { IProduct } from '@/models/Product';
import { unstable_cache } from 'next/cache';

// Helper to serialize Mongoose documents to plain objects
function serializeProduct(product: any) {
  const p = product.toObject ? product.toObject() : product;
  return {
    ...p,
    id: p._id.toString(),
    _id: p._id.toString(),
    createdAt: p.createdAt?.toISOString ? p.createdAt.toISOString() : p.createdAt,
    createdAt: p.createdAt?.toISOString ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt?.toISOString ? p.updatedAt.toISOString() : p.updatedAt,
    isAvailable: p.isAvailable !== undefined ? p.isAvailable : true,
    weights: p.weights?.map((w: any) => ({
      ...w,
      _id: w._id ? w._id.toString() : undefined,
    })) || [],
    reviews: p.reviews?.map((r: any) => ({
      ...r,
      _id: r._id ? r._id.toString() : undefined,
      createdAt: r.createdAt?.toISOString ? r.createdAt.toISOString() : r.createdAt,
      createdAt: r.createdAt?.toISOString ? r.createdAt.toISOString() : r.createdAt,
    })) || [],
    isCombo: p.isCombo !== undefined ? p.isCombo : false,
    storeId: p.storeId?.toString ? p.storeId.toString() : p.storeId,
  };
}

export async function getProducts() {
  await dbConnect();
  const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
  return products.map(serializeProduct);
}

export async function getProductsByStore(storeId: string) {
  await dbConnect();
  try {
    const products = await Product.find({ storeId, isActive: true }).sort({ createdAt: -1 });
    return products.map(serializeProduct);
  } catch (error) {
    console.error('Error fetching products by store:', error);
    return [];
  }
}

export async function getProductById(id: string) {
  await dbConnect();
  try {
    const product = await Product.findById(id);
    if (!product) return null;
    return serializeProduct(product);
  } catch (error) {
    return null;
  }
}

export async function addProduct(data: Partial<IProduct>) {
  await dbConnect();
  const product = await Product.create(data);
  return serializeProduct(product);
}

export async function updateProduct(id: string, data: Partial<IProduct>) {
  await dbConnect();
  const product = await Product.findByIdAndUpdate(id, data, { new: true });
  if (!product) return null;
  return serializeProduct(product);
}

export async function deleteProduct(id: string) {
  await dbConnect();
  const result = await Product.findByIdAndDelete(id);
  return !!result;
}

import dbConnect from '@/lib/mongodb';
import Section from '@/models/Section';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function getSections() {
  await dbConnect();
  // Ensure Product model is loaded
  if (!mongoose.models.Product) {
      mongoose.model('Product', Product.schema);
  }
  
  const sections = await Section.find({ isActive: true })
    .sort({ order: 1 })
    .populate('products')
    .lean();
    
  return sections.map(section => ({
    ...section,
    _id: section._id.toString(),
    id: section._id.toString(),
    products: section.products.map((p: any) => ({
      _id: p._id.toString(),
      id: p._id.toString(),
      price: p.price,
      name: p.name,
      images: p.images || [],
      category: p.category,
      tags: p.tags || [],
      // Ensure complex types (like Decimals) are handled if present
      ...JSON.parse(JSON.stringify(p)) 
    }))
  }));
}

export async function createSection(data: any) {
    await dbConnect();
    const section = await Section.create(data);
    return section;
}

export async function updateSection(id: string, data: any) {
    await dbConnect();
    const section = await Section.findByIdAndUpdate(id, data, { new: true });
    return section;
}

export async function deleteSection(id: string) {
    await dbConnect();
    await Section.findByIdAndDelete(id);
    return true;
}



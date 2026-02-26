import dbConnect from '@/lib/mongodb';
import Store, { IStore } from '@/models/Store';

export function serializeStore(store: any) {
  const s = store.toObject ? store.toObject() : store;
  return {
    ...s,
    id: s._id.toString(),
    _id: s._id.toString(),
    vendorId: s.vendorId?.toString ? s.vendorId.toString() : s.vendorId,
    createdAt: s.createdAt?.toISOString ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt?.toISOString ? s.updatedAt.toISOString() : s.updatedAt,
  };
}

export async function getStoreByVendorId(vendorId: string) {
  await dbConnect();
  try {
    const store = await Store.findOne({ vendorId, isActive: true });
    if (!store) return null;
    return serializeStore(store);
  } catch (error) {
    console.error('Error fetching store by vendor id:', error);
    return null;
  }
}

export async function getStores() {
  await dbConnect();
  const stores = await Store.find({}).sort({ createdAt: -1 }).populate('vendorId', 'name email');
  return stores.map(serializeStore);
}

export async function getListedStores() {
  await dbConnect();
  try {
    const stores = await Store.find({ 
        isActive: true, 
        isListedOnHome: true 
    }).sort({ createdAt: -1 });
    return stores.map(serializeStore);
  } catch (error) {
    console.error('Error fetching listed stores:', error);
    return [];
  }
}

export async function getStoreById(id: string) {
  await dbConnect();
  try {
    const store = await Store.findById(id).populate('vendorId', 'name email');
    if (!store) return null;
    return serializeStore(store);
  } catch (error) {
    return null;
  }
}

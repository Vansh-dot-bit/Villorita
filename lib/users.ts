import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function getVendors() {
  await dbConnect();
  const vendors = await User.find({ role: 'vendor' }).select('_id name email phone').sort({ name: 1 });
  return vendors.map(v => ({
    id: v._id.toString(),
    name: v.name,
    email: v.email,
    phone: v.phone
  }));
}

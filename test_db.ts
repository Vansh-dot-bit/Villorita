import mongoose from 'mongoose';
import dbConnect from './lib/mongodb';
import Cart from './models/Cart';
import Coupon from './models/Coupon';

async function test() {
  await dbConnect();
  const coupons = await Coupon.find();
  console.log('Coupons:', Array.from(coupons).map((c: any) => ({ code: c.code, value: c.discountValue, type: c.discountType, max: c.maxDiscount })));
  
  const carts = await Cart.find().populate('items.product');
  carts.forEach((cart: any) => {
    let itemsTotal = cart.items.reduce((acc: number, item: any) => acc + (item.selectedPrice * item.quantity), 0);
    console.log(`Cart UI Total would be: ${itemsTotal}. Items selectedPrice:`, cart.items.map((i: any) => i.selectedPrice));
  });
  
  process.exit(0);
}
test();

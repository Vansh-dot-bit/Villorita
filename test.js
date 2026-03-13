require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const coupons = await db.collection('coupons').find().toArray();
  console.log('Coupons:', coupons.map(c => ({ code: c.code, val: c.discountValue, type: c.discountType, max: c.maxDiscount })));
  
  const carts = await db.collection('carts').find().toArray();
  carts.forEach(c => {
    let tot = c.items.reduce((acc, i) => acc + (i.selectedPrice * i.quantity), 0);
    console.log(`Cart total: ${tot}, addons: ${c.addons ? c.addons.reduce((a, ad) => a + (ad.price * ad.quantity), 0) : 0}`);
  });
  process.exit();
}
test();

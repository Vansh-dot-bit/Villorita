const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const cart = await db.collection('carts').findOne({ "addons.0": { $exists: true } });
  console.dir(cart, { depth: null });
  process.exit(0);
});

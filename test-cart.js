const mongoose = require('mongoose');
require('dotenv').config({path: '.env.local'});
const Cart = require('./models/Cart').default;

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const cart = await Cart.findOne();
  if (!cart) {
      console.log('No cart');
      process.exit(0);
  }
  
  cart.addons = [{ addon: new mongoose.Types.ObjectId(), name: "Test Addon", price: 100, quantity: 2 }];
  await cart.save();
  
  const savedCart = await Cart.findById(cart._id);
  console.log("Cart items:", savedCart.items.length);
  console.log("Total Amount after add-on (should be itemsTotal + 200)", savedCart.totalAmount);
  
  const calculatedItems = savedCart.items.reduce((s, i) => s + (i.price * i.quantity), 0);
  console.log("Items calc:", calculatedItems);
  console.log("Diff (addons calc):", savedCart.totalAmount - calculatedItems);
  process.exit(0);
});

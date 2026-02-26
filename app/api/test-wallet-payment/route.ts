import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/models/User';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import dbConnect from '@/lib/mongodb';
import { generateToken } from '@/lib/auth';

// This route simulates the payment flow test
export async function GET() {
  await dbConnect();
  
  try {
      // 1. Get or create a test user
      let user = await User.findOne({ email: 'test_wallet_api@example.com' });
      if (!user) {
          user = await User.create({
              name: 'Test Wallet User API',
              email: 'test_wallet_api@example.com',
              password: 'password123',
              role: 'user',
              walletBalance: 500
          });
      } else {
          user.walletBalance = 500;
          await user.save();
      }

      // 2. Add item to cart
      const product = await Product.findOne({});
      if (!product) {
          return NextResponse.json({ error: 'No products found' });
      }
      
      const price = 200;
      let cart = await Cart.findOne({ user: user._id });
      if (!cart) {
          cart = await Cart.create({ user: user._id, items: [] });
      }
      
      cart.items = [{
          product: product._id,
          name: product.name,
          image: product.images[0] || 'img.jpg',
          price: price,
          selectedPrice: price,
          weight: '1kg',
          quantity: 1,
          type: 'Eggless'
      }];
      cart.totalAmount = price;
      await cart.save();

      // 3. Call create-order API internally (simulate fetch)
      // Since we are inside the server, we can't easily fetch our own API if it's not running on a public URL sometimes
      // But we can try fetching localhost:3000
      
      const token = generateToken(user._id.toString(), 'user');
      
      const res = await fetch('http://localhost:3000/api/payment/create-order', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
              useWallet: true,
              walletUsed: 50,
              locationId: null // Force default delivery charge
          })
      });
      
      const data = await res.json();
      
      return NextResponse.json({
          test: 'Wallet Deduction',
          userWallet: 500,
          walletUsed: 50,
          cartTotal: 200,
          deliveryExpected: 50, // < 500
          expectedAmount: (200 + 50 - 50) * 100, // 20000 paise
          actualResponse: data
      });

  } catch (error: any) {
      return NextResponse.json({ error: error.message, stack: error.stack });
  }
}

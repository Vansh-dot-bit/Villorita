// Database seed script to populate initial data
// Run this with: node scripts/seed.js

import dbConnect from '../lib/mongodb';
import User from '../models/User';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    await dbConnect();
    console.log('🔌 Connected to MongoDB');

    // Clear existing data (optional - comment out if you don't want to clear)
    // await User.deleteMany({});
    // await Product.deleteMany({});
    // await Coupon.deleteMany({});
    // console.log('🗑️  Cleared existing data');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.findOneAndUpdate(
      { email: 'admin@purplebite.com' },
      {
        name: 'Admin',
        email: 'admin@purplebite.com',
        password: hashedPassword,
        role: 'admin',
      },
      { upsert: true, new: true }
    );
    console.log('👤 Created admin user:', admin.email);

    // Create sample products
    const products = [
      {
        name: 'Rich Chocolate Truffle',
        description: 'Decadent chocolate cake with rich chocolate ganache and chocolate shavings',
        price: 699,
        category: 'birthday',
        image: '/images/chocolate-truffle.jpg',
        features: { eggless: true, sugarFree: false, vegan: false },
        weights: [
          { weight: '500g', price: 499 },
          { weight: '1kg', price: 699 },
          { weight: '2kg', price: 1299 },
        ],
        stock: 50,
        rating: { average: 4.8, count: 124 },
      },
      {
        name: 'Classic Vanilla Delight',
        description: 'Soft vanilla sponge with fresh cream and seasonal fruits',
        price: 599,
        category: 'birthday',
        image: '/images/vanilla-delight.jpg',
        features: { eggless: true, sugarFree: false, vegan: false },
        weights: [
          { weight: '500g', price: 399 },
          { weight: '1kg', price: 599 },
          { weight: '2kg', price: 1099 },
        ],
        stock: 45,
        rating: { average: 4.6, count: 98 },
      },
      {
        name: 'Red Velvet Romance',
        description: 'Elegant red velvet cake with cream cheese frosting',
        price: 799,
        category: 'wedding',
        image: '/images/red-velvet.jpg',
        features: { eggless: true, sugarFree: false, vegan: false },
        weights: [
          { weight: '1kg', price: 799 },
          { weight: '2kg', price: 1499 },
          { weight: '3kg', price: 2199 },
        ],
        stock: 30,
        rating: { average: 4.9, count: 156 },
      },
      {
        name: 'Butterscotch Bliss',
        description: 'Butterscotch flavored cake with caramel sauce and nuts',
        price: 649,
        category: 'anniversary',
        image: '/images/butterscotch.jpg',
        features: { eggless: true, sugarFree: false, vegan: false },
        weights: [
          { weight: '500g', price: 449 },
          { weight: '1kg', price: 649 },
          { weight: '2kg', price: 1199 },
        ],
        stock: 40,
        rating: { average: 4.7, count: 87 },
      },
      {
        name: 'Black Forest Special',
        description: 'Classic black forest with chocolate, cherry, and whipped cream',
        price: 749,
        category: 'bestseller',
        image: '/images/black-forest.jpg',
        features: { eggless: true, sugarFree: false, vegan: false },
        weights: [
          { weight: '500g', price: 499 },
          { weight: '1kg', price: 749 },
          { weight: '2kg', price: 1399 },
        ],
        stock: 60,
        rating: { average: 4.9, count: 203 },
      },
    ];

    for (const productData of products) {
      await Product.findOneAndUpdate(
        { name: productData.name },
        productData,
        { upsert: true, new: true }
      );
      console.log('🍰 Created product:', productData.name);
    }

    // Create sample coupons
    const coupons = [
      {
        code: 'WELCOME10',
        description: '10% off on your first order',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 500,
        maxDiscount: 100,
        expiryDate: new Date('2026-12-31'),
        usageLimit: 1000,
      },
      {
        code: 'SAVE50',
        description: 'Flat ₹50 off on orders above ₹500',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 500,
        expiryDate: new Date('2026-12-31'),
        usageLimit: null,
      },
      {
        code: 'BIRTHDAY20',
        description: '20% off on birthday cakes',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 700,
        maxDiscount: 200,
        expiryDate: new Date('2026-12-31'),
        usageLimit: 500,
      },
    ];

    for (const couponData of coupons) {
      await Coupon.findOneAndUpdate(
        { code: couponData.code },
        couponData,
        { upsert: true, new: true }
      );
      console.log('🎟️  Created coupon:', couponData.code);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Admin Credentials:');
    console.log('   Email: admin@purplebite.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  REMEMBER TO CHANGE ADMIN PASSWORD IN PRODUCTION!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();

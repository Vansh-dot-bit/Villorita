// Script to check users and their orders in the database
import mongoose from 'mongoose';
import User from '../models/User';
import Order from '../models/Order';
import dbConnect from '../lib/mongodb';

async function checkDatabase() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('_id name email role');
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user._id}, Role: ${user.role})`);
    });

    console.log('\n--- Checking Orders ---');
    const orders = await Order.find({}).populate('user', 'name email');
    console.log(`Found ${orders.length} orders:`);
    
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`  Order ID: ${order._id}`);
      console.log(`  User Field (ObjectId): ${order.user}`);
      console.log(`  User Details: ${order.user ? (order.user as any).email : 'N/A'}`);
      console.log(`  Status: ${order.orderStatus}`);
      console.log(`  Total: ₹${order.totalAmount}`);
    });

    // Check for duplicate orders
    console.log('\n--- Checking for Issues ---');
    const userOrderCounts = new Map<string, number>();
    orders.forEach(order => {
      const userId = order.user?._id?.toString() || order.user?.toString() || 'unknown';
      userOrderCounts.set(userId, (userOrderCounts.get(userId) || 0) + 1);
    });

    console.log('\nOrders per user:');
    userOrderCounts.forEach((count, userId) => {
      const user = users.find(u => u._id.toString() === userId);
      console.log(`  ${user?.email || 'Unknown'}: ${count} orders`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();

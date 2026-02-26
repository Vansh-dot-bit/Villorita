// Script to check user role in database
import dbConnect from '../lib/mongodb.js';
import User from '../models/User.js';

async function checkUserRole(email) {
  try {
    await dbConnect();
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      return;
    }
    
    console.log('✅ User found:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Created:', user.createdAt);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/check-vendor-role.js <email>');
  process.exit(1);
}

checkUserRole(email);

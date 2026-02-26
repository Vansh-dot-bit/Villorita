import mongoose from 'mongoose';
import Coupon from '../models/Coupon';
import dbConnect from '../lib/mongodb';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function checkCoupons() {
  await dbConnect();
  console.log('Connected to DB');

  const coupons = await Coupon.find({});
  console.log(`Found ${coupons.length} coupons:`);
  
  coupons.forEach(c => {
    console.log(`Code: ${c.code}`);
    console.log(`Type: ${c.discountType}`);
    console.log(`Value: ${c.discountValue}`);
    console.log(`Active: ${c.isActive}`);
    console.log('-------------------');
  });

  process.exit(0);
}

checkCoupons().catch(console.error);


import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load env vars manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.log('Could not read .env.local', e);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, default: 'user' },
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function promote() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to DB');

    const email = 'vanshgoyalji4@gmail.com';
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { role: 'admin' } },
      { new: true }
    );

    if (user) {
      console.log(`Successfully promoted ${email} to admin.`);
      console.log('Current Role:', user.role);
    } else {
      console.log(`User ${email} not found.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

promote();

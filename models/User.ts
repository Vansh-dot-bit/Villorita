import mongoose, { Schema, Document } from 'mongoose';

interface IAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'vendor' | 'delivery_agent';
  phone?: string;
  walletBalance: number;
  addresses: IAddress[];
  googleId?: string;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  otp?: string;
  otpExpires?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    // Password is now optional because of OTP/Google login
    required: false,
    minlength: [6, 'Password must be at least 6 characters'],
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'vendor', 'delivery_agent'],
    default: 'user',
  },
  phone: {
    type: String,
    trim: true,
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  addresses: [{
    name: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: Boolean,
  }],
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

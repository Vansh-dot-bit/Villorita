import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import AddOn from '@/models/AddOn';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();
    const body = await request.json();
    const { addonId, quantity = 1 } = body;

    const addon = await AddOn.findById(addonId);
    if (!addon || !addon.isActive) {
      return NextResponse.json({ error: 'Addon not found or inactive' }, { status: 404 });
    }

    const userIdObj = new mongoose.Types.ObjectId(user.userId);
    let cart = await Cart.findOne({ user: userIdObj });
    if (!cart) cart = new Cart({ user: userIdObj, items: [], addons: [] });
    
    if (!cart.addons) cart.addons = [] as any;

    const existingIndex = cart.addons.findIndex((a: any) => a.addon.toString() === addonId);
    if (existingIndex > -1) {
      cart.addons[existingIndex].quantity += quantity;
    } else {
      cart.addons.push({
        addon: addonId,
        name: addon.name,
        price: addon.price,
        quantity
      });
    }

    await cart.save();
    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const addonId = searchParams.get('addonId');
    const userIdObj = new mongoose.Types.ObjectId(user.userId);

    const cart = await Cart.findOne({ user: userIdObj });
    if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

    if (addonId) {
      cart.addons = cart.addons.filter((a: any) => a.addon.toString() !== addonId) as any;
    } else {
      cart.addons = [] as any;
    }

    await cart.save();
    return NextResponse.json({ success: true, cart });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

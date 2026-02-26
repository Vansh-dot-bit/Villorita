import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';
import Product from '@/models/Product';
import { requireAuth } from '@/lib/auth';

// GET user's cart
// GET user's cart
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const userIdObj = new mongoose.Types.ObjectId(user.userId);
    let cart = await Cart.findOne({ user: userIdObj }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: userIdObj, items: [] });
    }

    // Filter out items where product is null (e.g. deleted products)
    if (cart && cart.items) {
      cart.items = cart.items.filter((item: any) => item.product);
    }

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (error: any) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    // 1. Safe Body Parsing
    let body;
    try {
        body = await request.json();
    } catch (e) {
        console.error("[API_CART] Failed to parse JSON body", e);
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    console.log('[API_CART_POST] Request body:', body);
    const { productId, quantity = 1, weight = '1kg' } = body;
    console.log(`[API_CART_POST] Adding item: ProductID=${productId}, Qty=${quantity}, UserID=${user.userId}`);

    if (!productId) {
      console.error('[API_CART_POST] Missing productId');
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // 2. Verify product exists
    let product;
    try {
        product = await Product.findById(productId);
    } catch (e) {
        console.error(`[API_CART_POST] Product lookup error for ${productId}:`, e);
        return NextResponse.json({ error: "Invalid Product ID format" }, { status: 400 });
    }

    if (!product) {
      console.error(`[API_CART_POST] Product not found: ${productId}`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if product is available
    if (product.isAvailable === false) {
       console.error(`[API_CART_POST] Product is unavailable: ${productId}`);
       return NextResponse.json(
        { error: 'This product is currently unavailable' },
        { status: 400 }
       );
    }

    // 3. Find weight-specific price
    let selectedPrice = product.price;
    if (product.weights && product.weights.length > 0) {
      const weightOption = product.weights.find((w: any) => w.weight === weight);
      if (weightOption) {
        selectedPrice = weightOption.price;
      }
    }

    // 4. Find or Create Cart
    const userIdObj = new mongoose.Types.ObjectId(user.userId);
    let cart = await Cart.findOne({ user: userIdObj });

    if (!cart) {
      console.log(`[API_CART_POST] No cart found, creating new one for user ${user.userId}`);
      cart = new Cart({ user: userIdObj, items: [] });
    }

    // 5. Update Items
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.product.toString() === productId && item.weight === weight
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        weight,
        selectedPrice,
      });
    }

    // 6. Save Cart
    await cart.save();
    console.log('[API_CART_POST] Cart saved successfully. Items count:', cart.items.length);

    // 7. Return Updated Cart
    cart = await Cart.findOne({ user: userIdObj }).populate('items.product');
    
    // Filter out valid items
    if (cart && cart.items) {
        cart.items = cart.items.filter((item: any) => item.product);
    }

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error: any) {
    console.error('[API_CART_POST] Critical Error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart or clear cart
export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const userIdObj = new mongoose.Types.ObjectId(user.userId);

    const cart = await Cart.findOne({ user: userIdObj });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    if (itemId) {
      // Remove specific item
      cart.items = cart.items.filter((item: any) => item._id.toString() !== itemId);
    } else {
      // Clear entire cart
      cart.items = [];
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      message: itemId ? 'Item removed from cart' : 'Cart cleared',
      cart,
    });
  } catch (error: any) {
    console.error('Delete cart item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update item quantity
export async function PATCH(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof Response) return user;

    await dbConnect();

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Valid item ID and quantity are required' },
        { status: 400 }
      );
    }

    const userIdObj = new mongoose.Types.ObjectId(user.userId);
    const cart = await Cart.findOne({ user: userIdObj });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    const item = cart.items.find((item: any) => item._id.toString() === itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findOne({ user: userIdObj }).populate('items.product');

    return NextResponse.json({
      success: true,
      message: 'Cart updated',
      cart: updatedCart,
    });
  } catch (error: any) {
    console.error('Update cart error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart', details: error.message },
      { status: 500 }
    );
  }
}

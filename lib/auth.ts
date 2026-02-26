import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env');
}

interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Generate JWT token for a user
 */
export function generateToken(userId: string, role: string = 'user'): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract user from request headers
 */
export function getUserFromRequest(request: Request): TokenPayload | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid authorization header found');
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    console.log('Token verification failed');
  }
  
  return payload;
}

/**
 * Require authentication middleware
 */
export function requireAuth(request: Request): TokenPayload | NextResponse {
  const user = getUserFromRequest(request);
  
  if (!user) {
    console.log('Authentication failed - no user found');
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }
  
  return user;
}

/**
 * Require admin role
 */
export function requireAdmin(request: Request): TokenPayload | NextResponse {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }
  
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden. Admin access required.' },
      { status: 403 }
    );
  }
  
  return user;
}

/**
 * Require vendor role
 */
export function requireVendor(request: Request): TokenPayload | NextResponse {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }
  
  if (user.role !== 'vendor' && user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden. Vendor access required.' },
      { status: 403 }
    );
  }
  
  return user;
}

/**
 * Require delivery agent role
 */
export function requireDeliveryAgent(request: Request): TokenPayload | NextResponse {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }
  
  if (user.role !== 'delivery_agent' && user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden. Delivery agent access required.' },
      { status: 403 }
    );
  }
  
  return user;
}

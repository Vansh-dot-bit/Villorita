# API Test Examples

## Quick Start Testing Script

You can paste this into your browser console to test the APIs:

```javascript
// Base URL
const API_URL = 'http://localhost:3000/api';
let authToken = '';

// 1. Register a new user
async function testRegister() {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  console.log('Register:', data);
  authToken = data.token;
  return data;
}

// 2. Login
async function testLogin() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  console.log('Login:', data);
  authToken = data.token;
  return data;
}

// 3. Get all products
async function testGetProducts() {
  const response = await fetch(`${API_URL}/products`);
  const data = await response.json();
  console.log('Products:', data);
  return data;
}

// 4. Create a product (Admin only)
async function testCreateProduct() {
  const response = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      name: 'Chocolate Delight',
      description: 'Rich chocolate cake with chocolate ganache',
      price: 599,
      category: 'birthday',
      image: 'https://example.com/cake.jpg',
      features: { eggless: true },
      weights: [
        { weight: '500g', price: 399 },
        { weight: '1kg', price: 599 }
      ]
    })
  });
  const data = await response.json();
  console.log('Create Product:', data);
  return data;
}

// 5. Add to cart
async function testAddToCart(productId) {
  const response = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      productId: productId,
      quantity: 1,
      weight: '1kg'
    })
  });
  const data = await response.json();
  console.log('Add to Cart:', data);
  return data;
}

// 6. Get cart
async function testGetCart() {
  const response = await fetch(`${API_URL}/cart`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  const data = await response.json();
  console.log('Cart:', data);
  return data;
}

// 7. Create order
async function testCreateOrder() {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      shippingAddress: {
        name: 'Test User',
        phone: '9876543210',
        addressLine1: '123 Main Street',
        addressLine2: 'Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      paymentMethod: 'COD'
    })
  });
  const data = await response.json();
  console.log('Create Order:', data);
  return data;
}

// 8. Get user orders
async function testGetOrders() {
  const response = await fetch(`${API_URL}/orders`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  const data = await response.json();
  console.log('Orders:', data);
  return data;
}

// 9. Validate coupon
async function testValidateCoupon() {
  const response = await fetch(`${API_URL}/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'SAVE10',
      orderAmount: 1000
    })
  });
  const data = await response.json();
  console.log('Validate Coupon:', data);
  return data;
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🧪 Starting API Tests...\n');
    
    await testRegister();
    console.log('✅ Register passed\n');
    
    await testGetProducts();
    console.log('✅ Get Products passed\n');
    
    // For cart and order tests, you'll need a real product ID
    // const cart = await testAddToCart('PRODUCT_ID_HERE');
    // const orders = await testCreateOrder();
    
    console.log('🎉 All basic tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for easy access
console.log('📝 API Test Functions loaded!');
console.log('Run: runAllTests() to test all endpoints');
console.log('Or use individual functions: testRegister(), testLogin(), etc.');
```

## PowerShell Testing (Windows)

```powershell
# Register User
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Get Products
Invoke-RestMethod -Uri "http://localhost:3000/api/products" -Method GET
```

## cURL Testing

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Get Products
curl http://localhost:3000/api/products

# Add to Cart (with auth)
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"productId":"...","quantity":1,"weight":"1kg"}'
```

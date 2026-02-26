
// using global fetch
import fs from 'fs';

const LOG_FILE = 'debug_output.txt';
function log(msg: string, ...args: any[]) {
    console.log(msg, ...args);
    const argsStr = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    fs.appendFileSync(LOG_FILE, msg + ' ' + argsStr + '\n');
}
// clear log file
fs.writeFileSync(LOG_FILE, '');

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'admin@purplebite.com';
const PASSWORD = 'admin123';

async function run() {
    log('--- Starting Debug Cart Flow ---');

    // 1. Register / Login
    log('\n1. Registering/Logging in...');
    let token;
    const email = `debug_${Date.now()}@test.com`;
    const password = 'password123';
    
    try {
        // Try registering first
        log(`Attempting to register ${email}...`);
        const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: 'Debug User' })
        });
        const registerData = await registerRes.json();
        
        if (registerData.success || registerData.token) {
             token = registerData.token;
             log('✅ Registration successful. Token acquired.');
        } else {
             log('Registration failed (maybe exists?), trying login...');
             const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const loginData = await loginRes.json();
             if (!loginData.success) {
                log('❌ Login failed:', loginData);
                return;
            }
            token = loginData.token;
            log('✅ Login successful. Token acquired.');
        }

    } catch (e) {
        log('❌ Auth error:', e);
        return;
    }

    // 2. Fetch Products to get a valid ID
    log('\n2. Fetching Products...');
    let productId;
    try {
        const productRes = await fetch(`${BASE_URL}/api/products`);
        const productData = await productRes.json();
        
        if (!productData.success || productData.products.length === 0) {
            log('❌ No products found to add to cart.');
            return;
        }
        productId = productData.products[0]._id;
        log(`✅ Found product: ${productData.products[0].name} (ID: ${productId})`);
    } catch (e) {
        log('❌ Product fetch error:', e);
        return;
    }

    // 3. Add to Cart
    log('\n3. Adding to Cart...');
    try {
        const addRes = await fetch(`${BASE_URL}/api/cart`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1,
                weight: '1kg'
            })
        });
        const addData = await addRes.json();
        if (!addData.success) {
            log('❌ Add to cart failed:', addData);
        } else {
            log('✅ Added to cart successfully.');
            // console.log('Cart state:', JSON.stringify(addData.cart, null, 2));
        }
    } catch (e) {
        log('❌ Add to cart error:', e);
    }

    // 4. Fetch Cart Verification
    log('\n4. Verifying Cart...');
    try {
        const cartRes = await fetch(`${BASE_URL}/api/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cartData = await cartRes.json();
        log(`✅ Current Cart Items: ${cartData.cart?.items?.length || 0}`);
        if(cartData.cart?.items?.length > 0) {
            log('Items:', cartData.cart.items.map(i => `${i.product.name} (Qty: ${i.quantity})`).join(', '));
        } else {
             log('❌ Cart is empty after adding item!');
        }
    } catch (e) {
         log('❌ Cart fetch error:', e);
    }

    // 5. Create Order (Simulate Checkout Payment Click)
    log('\n5. Creating Order (Payment Init)...');
    try {
        const orderRes = await fetch(`${BASE_URL}/api/payment/create-order`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ couponCode: null }) // simulate no coupon
        });
        const orderData = await orderRes.json();
        
        if (orderData.error === 'Cart is empty') {
            console.error('❌ FAILED: Backend reported "Cart is empty" during order creation.');
        } else if (orderData.id) {
             console.log(`✅ SUCCESS: Order created! Order ID: ${orderData.id}`);
        } else {
             console.log('⚠️  Unexpected response:', orderData);
        }
    } catch (e) {
        console.error('❌ Create order error:', e);
    }
}

run();

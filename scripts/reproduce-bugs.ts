
const BASE_URL = 'http://127.0.0.1:3000';

async function main() {
  console.log('--- Starting Reproduction Script ---');
  console.log('Node Version:', process.version);

  // 1. Admin Login
  console.log('Logging in as Admin...');
  try {
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@purplebite.com', password: 'admin123' })
    });
    
    if (!adminRes.ok) {
        const text = await adminRes.text();
        throw new Error(`Admin login failed: ${adminRes.status} ${adminRes.statusText} - ${text}`);
    }

    const adminData = await adminRes.json();
    if (!adminData.token) {
        console.error('Failed to login as admin (no token):', adminData);
        return;
    }
    const adminToken = adminData.token;
    console.log('Admin logged in.');

    // 2. Test Add Category
    console.log('Testing Add Category...');
    const catName = 'TestCat_' + Date.now();
    const catRes = await fetch(`${BASE_URL}/api/categories`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name: catName, color: 'bg-red-500' })
    });
    
    if (!catRes.ok) {
        const text = await catRes.text();
        console.error(`Add Category Failed: ${catRes.status} ${catRes.statusText} - ${text}`);
    } else {
        const catData = await catRes.json();
        console.log('Add Category Result:', JSON.stringify(catData, null, 2));

        if (catData.success) {
            console.log('SUCCESS: Category added.');
        } else {
            console.error('FAILURE: Could not add category.');
        }
    }

    // 3. Regular User Login/Register
    const userEmail = `user_${Date.now()}@test.com`;
    console.log(`Registering new user: ${userEmail}`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email: userEmail, password: 'password123' })
    });
    
    let userToken;
    let regData;
    try {
        regData = await regRes.json();
    } catch (e) {
        const text = await regRes.text();
        console.error('Register response not JSON:', text);
        throw e;
    }
    
    if (regData.token) {
        userToken = regData.token;
    } else {
        // Try login if register failed (e.g. exists)
        console.log('Register response:', regData);
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, password: 'password123' })
        });
        const loginData = await loginRes.json();
        userToken = loginData.token;
    }
    
    if (!userToken) {
        console.error('Failed to get user token');
        return;
    }
    console.log('User logged in.');

    // 4. Test Order Visibility
    console.log('User fetching orders...');
    const userOrdersRes = await fetch(`${BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const userOrders = await userOrdersRes.json();
    console.log(`User sees ${userOrders.count || 0} orders.`);
    
    if (userOrders.orders && userOrders.orders.length > 0) {
        console.error('FAILURE: New user sees existing orders! (Should see 0)');
        console.log('First order seen:', userOrders.orders[0]);
    } else if (userOrders.success) {
        console.log('SUCCESS: New user sees 0 orders as expected.');
    } else {
        console.error('FAILURE: Failed to fetch orders:', userOrders);
    }

  } catch (err) {
      console.error('An error occurred:', err);
  }
}

main();

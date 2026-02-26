const fetch = require('node-fetch');

async function testApi() {
  try {
    // Attempt to hit the API. Since we are in the same environment, we might need the localhost URL.
    // Assuming default Next.js port 3000
    const response = await fetch('http://localhost:3000/api/cart', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // We might get 401 Unauthorized, which is GOOD (means endpoint exists)
        // If we get 404, that's BAD.
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    const text = await response.text();
    console.log(`Body: ${text}`);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testApi();

import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Base URL for the API
const API_URL = 'http://localhost:10000'; // Use your local server URL

// Test the products endpoint
async function testGetProducts() {
  try {
    console.log('Testing GET /api/products endpoint...');
    const response = await fetch(`${API_URL}/api/products`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const products = await response.json();
    console.log(`Success! Found ${products.length} products`);
    console.log('First product:', products[0] || 'No products found');
    return products;
  } catch (error) {
    console.error('Error testing products endpoint:', error.message);
    return null;
  }
}

// Test the featured products endpoint
async function testGetFeaturedProducts() {
  try {
    console.log('\nTesting GET /api/products/featured endpoint...');
    const response = await fetch(`${API_URL}/api/products/featured`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const featuredProducts = await response.json();
    console.log(`Success! Found ${featuredProducts.length} featured products`);
    console.log('First featured product:', featuredProducts[0] || 'No featured products found');
    return featuredProducts;
  } catch (error) {
    console.error('Error testing featured products endpoint:', error.message);
    return null;
  }
}

// Run the tests
async function runTests() {
  await testGetProducts();
  await testGetFeaturedProducts();
  console.log('\nAll tests completed!');
}

runTests();

import fetch from 'node-fetch';

// Base URL for the API
const API_URL = 'http://localhost:10000'; // Use your local server URL for testing

// Test data for creating an order
const testOrderData = {
  items: [
    {
      product: "64f5b7d1e5c5a1a1a1a1a1a1", // Replace with a valid product ID
      name: "Test Product",
      price: 99.99,
      quantity: 1
    }
  ],
  totalPrice: 99.99,
  shippingAddress: "123 Main St, City, Country",
  customerName: "Test User",
  customerEmail: "test@example.com",
  customerPhone: "+1234567890",
  paymentMethod: "cash_on_delivery",
  notes: "Test order"
};

// Test the order creation endpoint
async function testCreateOrder() {
  try {
    console.log('Testing POST /api/orders endpoint without authentication...');
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrderData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Success! Order created:', data);
    } else {
      console.error('Error creating order:', data);
    }
    
    return data;
  } catch (error) {
    console.error('Error testing order endpoint:', error.message);
    return null;
  }
}

// Run the test
testCreateOrder()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));

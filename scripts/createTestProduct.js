import mongoose from 'mongoose';
import { config } from '../config/default.js';
import Product from '../models/Product.js';

const createTestProduct = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || config.mongodb.uri, config.mongodb.options);
    console.log('Connected to MongoDB');

    // Check if test product already exists
    const existingProduct = await Product.findOne({ name: 'Test Product' });
    if (existingProduct) {
      console.log('Test product already exists');
      await mongoose.disconnect();
      return;
    }

    // Create a test product
    const testProduct = new Product({
      name: 'Test Product',
      price: 99.99,
      category: 'accessories',
      description: 'This is a test product to verify the product endpoints are working correctly.',
      image: 'https://placehold.co/300',
      imageType: 'url',
      stock: 100,
      featured: true
    });

    await testProduct.save();
    console.log('Test product created successfully');

    // Create a few more products with different categories
    const products = [
      {
        name: 'Test Phone',
        price: 599.99,
        category: 'phones',
        description: 'A high-quality test phone with amazing features.',
        image: 'https://placehold.co/300',
        imageType: 'url',
        stock: 50,
        featured: true
      },
      {
        name: 'Test Laptop',
        price: 1299.99,
        category: 'laptops',
        description: 'A powerful test laptop for all your computing needs.',
        image: 'https://placehold.co/300',
        imageType: 'url',
        stock: 25,
        featured: true
      },
      {
        name: 'Test Headphones',
        price: 149.99,
        category: 'headphones',
        description: 'Premium test headphones with noise cancellation.',
        image: 'https://placehold.co/300',
        imageType: 'url',
        stock: 75,
        featured: false
      }
    ];

    await Product.insertMany(products);
    console.log('Additional test products created successfully');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating test product:', error);
    process.exit(1);
  }
};

createTestProduct();

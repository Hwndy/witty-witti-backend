import mongoose from 'mongoose';
import { config } from '../config/default.js';
import Product from '../models/Product.js';

const updatePlaceholderImages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || config.mongodb.uri, config.mongodb.options);
    console.log('Connected to MongoDB');

    // Find all products with placeholder images
    const productsWithPlaceholder = await Product.find({
      image: { $regex: 'via.placeholder.com' }
    });

    console.log(`Found ${productsWithPlaceholder.length} products with placeholder images`);

    // Update each product with a new placeholder image URL
    for (const product of productsWithPlaceholder) {
      // Replace via.placeholder.com with placehold.co
      const newImageUrl = product.image.replace('via.placeholder.com', 'placehold.co');
      
      // Update the product
      await Product.findByIdAndUpdate(product._id, { image: newImageUrl });
      console.log(`Updated product ${product.name} with new image URL: ${newImageUrl}`);
    }

    console.log('All placeholder images updated successfully');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating placeholder images:', error);
    process.exit(1);
  }
};

// Run the script
updatePlaceholderImages();

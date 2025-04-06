import mongoose from 'mongoose';
import { config } from '../config/default.js';
import connectDB from '../config/db.js';

const testDbConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    
    // Connect to MongoDB
    const conn = await connectDB();
    
    if (conn) {
      console.log('Connection successful!');
      console.log('Connection state:', mongoose.connection.readyState);
      console.log('Connected to:', mongoose.connection.host);
      console.log('Database name:', mongoose.connection.name);
      
      // Check if we can perform a simple operation
      console.log('Testing a simple database operation...');
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`Found ${collections.length} collections:`);
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
      
      // Wait a bit to ensure we don't disconnect immediately
      console.log('Waiting for 5 seconds to ensure connection stability...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Disconnect
      console.log('Test completed. Disconnecting...');
      await mongoose.disconnect();
      console.log('Disconnected successfully.');
    } else {
      console.error('Connection failed or returned null.');
    }
  } catch (error) {
    console.error('Error testing MongoDB connection:', error);
  } finally {
    // Ensure we exit the process
    process.exit(0);
  }
};

testDbConnection();

import mongoose from 'mongoose';
import { config } from './default.js';

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || config.mongodb.uri;
    
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string format valid:', MONGODB_URI.startsWith('mongodb+srv://'));

    mongoose.set('strictQuery', true);
    
    const conn = await mongoose.connect(MONGODB_URI, {
      ...config.mongodb.options,
      autoIndex: process.env.NODE_ENV !== 'production', // Disable autoIndex in production
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (process.env.NODE_ENV === 'production' || config.server.env === 'production') {
      console.log('Retrying connection in 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      return connectDB();
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;

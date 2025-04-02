import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('Available environment variables:', Object.keys(process.env));
      throw new Error('MongoDB URI is not found in environment variables. Please check your Render environment configuration.');
    }

    console.log('Attempting to connect to MongoDB...');

    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 120000,
      socketTimeoutMS: 120000,
      connectTimeoutMS: 120000,
      keepAlive: true,
      keepAliveInitialDelay: 300000,
      dbName: 'witty-witi'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('Current NODE_ENV:', process.env.NODE_ENV);
      console.log('Retrying connection in 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      return connectDB();
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;

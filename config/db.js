import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI is not found in environment variables');
    }

    // Increased timeouts for Render's free tier
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 60000, // 60 seconds
      connectTimeoutMS: 60000, // 60 seconds
      keepAlive: true,
      keepAliveInitialDelay: 300000 // 5 minutes
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add connection error handlers
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Retry logic for initial connection
    if (process.env.NODE_ENV === 'production') {
      console.log('Retrying connection in 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      return connectDB(); // Retry connection
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;

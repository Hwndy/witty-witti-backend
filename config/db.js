import mongoose from 'mongoose';
import { config } from './default.js';

// Track connection state to prevent multiple connection attempts
let isConnecting = false;
let connectionEstablished = false;

const connectDB = async () => {
  // If already connecting, wait for the connection to be established
  if (isConnecting) {
    console.log('Connection attempt already in progress, waiting...');
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return mongoose.connection;
  }

  // If already connected, return the existing connection
  if (connectionEstablished && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return mongoose.connection;
  }

  isConnecting = true;

  try {
    const MONGODB_URI = process.env.MONGODB_URI || config.mongodb.uri;

    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string format valid:', MONGODB_URI.startsWith('mongodb+srv://'));

    mongoose.set('strictQuery', true);

    // Configure connection options
    const options = {
      ...config.mongodb.options,
      autoIndex: process.env.NODE_ENV !== 'production', // Disable autoIndex in production
      serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Set up connection event handlers before connecting
    mongoose.connection.on('connected', () => {
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
      connectionEstablished = true;
      isConnecting = false;
    });

    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
      if (connectionEstablished) {
        console.log('Attempting to reconnect to MongoDB...');
        connectionEstablished = false;
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      if (connectionEstablished) {
        console.log('Connection lost. Attempting to reconnect...');
        connectionEstablished = false;
        // Only attempt to reconnect if the disconnection wasn't intentional
        if (mongoose.connection.readyState !== 0) {
          setTimeout(() => {
            connectDB();
          }, 5000);
        }
      }
    });

    // Connect to MongoDB
    const conn = await mongoose.connect(MONGODB_URI, options);

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    isConnecting = false;

    if (process.env.NODE_ENV === 'production' || config.server.env === 'production') {
      console.log('Retrying connection in 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      return connectDB();
    } else {
      console.log('Failed to connect to MongoDB. Check your connection string and network.');
      // Don't exit the process in development mode to allow for debugging
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      return null;
    }
  }
};

export default connectDB;

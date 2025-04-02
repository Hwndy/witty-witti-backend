import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Load environment variables before any other code
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Log environment status
console.log('Environment Variables Status:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Increase timeout for all requests
    server.timeout = 120000;
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 120000;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

export default app;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Log environment status
console.log('Environment Variables Status:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running successfully on port ${PORT}`);
    });

    // Increase timeout for all requests
    server.timeout = 120000;
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 120000;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

export default app;

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { config } from './config/default.js';

const app = express();
const PORT = process.env.PORT || config.server.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log environment status
console.log('Environment Status:');
console.log('NODE_ENV:', process.env.NODE_ENV || config.server.env);
console.log('PORT:', PORT);

// Basic route to test server
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running',
    environment: process.env.NODE_ENV || config.server.env,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
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

    // Configure server timeouts
    server.timeout = config.server.timeouts.server;
    server.keepAliveTimeout = config.server.timeouts.server;
    server.headersTimeout = config.server.timeouts.headers;

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Received shutdown signal. Closing server...');
      server.close(async () => {
        console.log('Server closed. Disconnecting from database...');
        await mongoose.disconnect();
        console.log('Database disconnected. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

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

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;

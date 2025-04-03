import express from 'express';
import connectDB from './config/db.js';
import { config } from './config/default.js';
import corsConfig from './config/corsConfig.js';
import authRoutes from './routes/authRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || config.server.port;

// Middleware
app.use(corsConfig);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount routes
app.use('/api/auth', authRoutes);

// Basic route to test server
app.get('/', (req, res) => {
  res.json({
    message: 'Server is running',
    environment: process.env.NODE_ENV || config.server.env,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running successfully on port ${PORT}`);
      console.log(`📍 Auth endpoints available at: /api/auth/*`);
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

import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import favicon from 'serve-favicon';
import connectDB from './config/db.js';
import { config } from './config/default.js';
import corsConfig from './config/corsConfig.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || config.server.port;

// Import custom CORS middleware
import { corsMiddleware } from './middleware/corsMiddleware.js';

// Middleware
// Apply CORS middleware to all routes
app.use(corsMiddleware);
// Also keep the original CORS config as a fallback
app.use(corsConfig);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the public directory
app.use(express.static('public'));

// Serve favicon
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if favicon exists and serve it
try {
  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
} catch (err) {
  console.log('Favicon not found, continuing without it');
}

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Basic route to test server
app.get('/', (_req, res) => {
  res.json({
    message: 'Server is running',
    environment: process.env.NODE_ENV || config.server.env,
    timestamp: new Date().toISOString()
  });
});

// Import optional auth middleware
import { optionalAuth } from './middleware/authMiddleware.js';

// Health check endpoint with optional authentication
app.get('/api/health', optionalAuth, (req, res) => {
  // Set CORS headers for health check
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Return health status
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || config.server.env
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = await import('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      // Port is in use, try the next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Try to use the configured port, or find an available one
    const availablePort = await findAvailablePort(PORT);

    // Start the server
    const server = app.listen(availablePort, () => {
      console.log(`✅ Server running successfully on port ${availablePort}`);
      console.log(`📍 API endpoints available at:`);
      console.log(`   - Auth: /api/auth/*`);
      console.log(`   - Users: /api/users/*`);
      console.log(`   - Products: /api/products/*`);
      console.log(`   - Orders: /api/orders/*`);
      console.log(`   - Reviews: /api/reviews/*`);
      console.log(`   - Wishlist: /api/wishlist/*`);
      console.log(`   - Settings: /api/settings/*`);
      console.log(`   - Dashboard: /api/dashboard/*`);
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

  // If it's an EADDRINUSE error, don't exit the process
  // as our port finding mechanism will handle it
  if (err.code !== 'EADDRINUSE') {
    process.exit(1);
  }
});

export default app;

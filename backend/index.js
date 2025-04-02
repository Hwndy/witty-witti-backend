import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Import middleware
import corsConfig from './config/corsConfig.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Import models for initial data setup
import User from './models/User.js';
import Product from './models/Product.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://suleayo04:sulaimon@cluster0.u1quc.mongodb.net/witty-witi?retryWrites=true&w=majority&appName=Cluster0', )
  .then(async () => {
    console.log('MongoDB connected successfully');

    // Create admin user if it doesn't exist
    try {
      const adminExists = await User.findOne({ email: 'admin@wittywiti.com' });

      if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = new User({
          username: 'admin',
          email: 'admin@wittywiti.com',
          password: hashedPassword,
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User'
        });

        await admin.save();
        console.log('Admin user created');
      }

      // Create sample products if none exist
      const productsCount = await Product.countDocuments();

      if (productsCount === 0) {
        const sampleProducts = [
          {
            name: 'Wireless Earbuds',
            price: 49.99,
            category: 'headphones',
            description: 'High-quality wireless earbuds with noise cancellation and long battery life.',
            image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            stock: 25,
            featured: true
          },
          {
            name: 'Smartphone X Pro',
            price: 899.99,
            category: 'phones',
            description: 'Latest smartphone with 6.7-inch display, 5G connectivity, and advanced camera system.',
            image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            stock: 10,
            featured: true
          },
          {
            name: 'Ultra Slim Laptop',
            price: 1299.99,
            category: 'laptops',
            description: 'Powerful laptop with 16GB RAM, 512GB SSD, and 14-hour battery life.',
            image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            stock: 8,
            featured: true
          },
          {
            name: 'Portable Power Bank',
            price: 29.99,
            category: 'powerbanks',
            description: '20,000mAh power bank with fast charging capability for all your devices.',
            image: 'https://images.unsplash.com/photo-1585338447937-7082f8fc763d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            stock: 30,
            featured: true
          },
          {
            name: 'USB-C Fast Charger',
            price: 19.99,
            category: 'chargers',
            description: '65W USB-C charger compatible with laptops, tablets, and smartphones.',
            image: 'https://images.unsplash.com/photo-1583863788434-e62bd6bf5ebd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            stock: 40,
            featured: false
          },
          {
            name: 'Desk Fan',
            price: 24.99,
            category: 'fans',
            description: 'Quiet and powerful desk fan with adjustable speed and oscillation.',
            image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            stock: 15,
            featured: false
          },
          {
            name: 'Over-Ear Headphones',
            price: 149.99,
            category: 'headphones',
            description: 'Premium over-ear headphones with active noise cancellation and high-fidelity sound.',
            image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            stock: 12,
            featured: true
          },
          {
            name: 'Phone Case',
            price: 14.99,
            category: 'accessories',
            description: 'Durable and stylish phone case with drop protection.',
            image: 'https://images.unsplash.com/photo-1541877944-ac82a091518a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
            stock: 50,
            featured: false
          }
        ];

        await Product.insertMany(sampleProducts);
        console.log('Sample products created');
      }
    } catch (error) {
      console.error('Error creating initial data:', error);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

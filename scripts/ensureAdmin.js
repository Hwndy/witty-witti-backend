import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const ensureAdminExists = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if admin exists
    const adminEmail = 'admin@wittywiti.com';
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      // Create admin if doesn't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      admin = await User.create({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
    process.exit(1);
  }
};

ensureAdminExists();
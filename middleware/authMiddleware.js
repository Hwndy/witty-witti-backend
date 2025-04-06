import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ErrorResponse } from '../utils/errorHandler.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token with Buffer conversion for the secret
      const decoded = jwt.verify(
        token,
        Buffer.from(process.env.JWT_SECRET).toString('utf-8')
      );

      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const admin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(new ErrorResponse('Not authorized as an admin', 403));
  }
};

// Optional authentication middleware - doesn't require a token but will use it if present
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];

      try {
        // Verify token with Buffer conversion for the secret
        const decoded = jwt.verify(
          token,
          Buffer.from(process.env.JWT_SECRET).toString('utf-8')
        );

        req.user = await User.findById(decoded.id);
        console.log('User authenticated:', req.user ? req.user.username : 'unknown');
      } catch (error) {
        console.log('Invalid token provided, continuing as guest');
        // Don't return an error, just continue without setting req.user
      }
    } else {
      console.log('No token provided, continuing as guest');
    }

    // Always continue to the next middleware, with or without a user
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Even if there's an error, we still continue to the next middleware
    next();
  }
};

// Combined middleware for routes that need both authentication and admin rights
export const auth = {
  protect,
  admin,
  optionalAuth
};

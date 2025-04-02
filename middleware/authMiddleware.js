import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ErrorResponse } from '../utils/errorHandler.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

export const admin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(new ErrorResponse('Not authorized as an admin', 403));
  }
};

// Combined middleware for routes that need both authentication and admin rights
export const auth = {
  protect,
  admin
};

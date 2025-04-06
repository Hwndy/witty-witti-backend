import cors from 'cors';
import { config } from './default.js';

const corsOptions = {
  origin: function(origin, callback) {
    const isProduction = process.env.NODE_ENV === 'production' || config.server.env === 'production';
    const allowedOrigins = config.cors.productionOrigins.concat(config.cors.developmentOrigins);

    // Log the request origin for debugging
    console.log('CORS request from origin:', origin);

    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      console.log('CORS: No origin - allowing request');
      return callback(null, true);
    }

    // Special case for witty-witi.vercel.app
    if (origin && origin.includes('witty-witi.vercel.app')) {
      console.log('CORS: Allowing witty-witi.vercel.app origin:', origin);
      return callback(null, origin);
    }

    // Special case for localhost
    if (origin && origin.includes('localhost')) {
      console.log('CORS: Allowing localhost origin:', origin);
      return callback(null, origin);
    }

    // In development mode, allow all origins for easier testing
    if (!isProduction) {
      console.log('CORS: Development mode - allowing origin:', origin);
      return callback(null, origin || true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Allowed origin:', origin);
      callback(null, origin);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default cors(corsOptions);

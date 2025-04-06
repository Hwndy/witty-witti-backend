import cors from 'cors';
import { config } from './default.js';

const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      ...config.cors.productionOrigins,
      ...config.cors.developmentOrigins
    ];

    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Content-Type-Options'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default cors(corsOptions);

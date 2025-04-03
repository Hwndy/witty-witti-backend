import cors from 'cors';
import { config } from './default.js';

const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = (process.env.NODE_ENV === 'production' || config.server.env === 'production')
      ? config.cors.productionOrigins
      : config.cors.developmentOrigins;

    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
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

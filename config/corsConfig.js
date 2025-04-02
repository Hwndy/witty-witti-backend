import cors from 'cors';
import { config } from './default.js';

const corsOptions = {
  origin: (process.env.NODE_ENV === 'production' || config.server.env === 'production')
    ? config.cors.productionOrigins
    : config.cors.developmentOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

export default cors(corsOptions);

import cors from 'cors';

// Configure CORS options
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://wittywiti.com', 'https://wittywiti.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:5174', 'https://wittywiti.vercel.app/'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Export configured CORS middleware
export default cors(corsOptions);
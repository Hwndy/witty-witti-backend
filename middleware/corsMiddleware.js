// Enhanced CORS middleware for all routes
export const corsMiddleware = (req, res, next) => {
  // Allow requests from any origin in development
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://wittywiti.vercel.app',
    'https://witty-witi.vercel.app',
    'http://witty-witi.vercel.app',
    'https://wittywiti.com'
  ];

  const origin = req.headers.origin;
  console.log('CORS Middleware - Request from origin:', origin);

  // Special case for witty-witi.vercel.app
  if (origin && origin.includes('witty-witi.vercel.app')) {
    console.log('CORS Middleware - Allowing witty-witi.vercel.app origin:', origin);
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // Set CORS headers for known origins
  else if (origin && allowedOrigins.includes(origin)) {
    console.log('CORS Middleware - Allowing known origin:', origin);
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // For requests without origin or unknown origins, allow all in development
    console.log('CORS Middleware - Using wildcard for origin:', origin);
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // Allow credentials
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Allow specific headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  // Allow specific methods
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  // Set max age for preflight requests
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};

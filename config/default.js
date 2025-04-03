export const config = {
  mongodb: {
    uri: 'mongodb+srv://suleayo04:sulaimon@cluster0.u1quc.mongodb.net/?retryWrites=true&w=majority',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 120000,
      socketTimeoutMS: 120000,
      connectTimeoutMS: 120000,
      
      dbName: 'witty-witi'
    }
  },
  server: {
    port: 10000,
    env: 'production',
    timeouts: {
      server: 120000,
      headers: 120000
    }
  },
  security: {
    jwtSecret: '94cc0c7d6c7e453d86192ddfb9e35cf07acfd3c1'
  },
  cors: {
    productionOrigins: [
      'https://wittywiti.com',
      'https://wittywiti.vercel.app',
      'https://witty-witti-backend.onrender.com'
    ],
    developmentOrigins: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://wittywiti.vercel.app',
      'https://witty-witti-backend.onrender.com'
    ]
  }
};

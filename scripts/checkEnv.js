import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checkEnv = () => {
  // Load .env file
  dotenv.config();

  // Required environment variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  const missingVars = [];

  // Check for missing environment variables
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(variable => {
      console.error(`- ${variable}`);
    });
    process.exit(1);
  }

  console.log('All required environment variables are present.');
};

checkEnv();
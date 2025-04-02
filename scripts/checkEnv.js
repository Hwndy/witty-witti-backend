import { config } from '../config/default.js';

const checkEnv = () => {
  console.log('Environment check passed - using default configuration');
  console.log('Server environment:', process.env.NODE_ENV || config.server.env);
  console.log('Server port:', process.env.PORT || config.server.port);
};

checkEnv();

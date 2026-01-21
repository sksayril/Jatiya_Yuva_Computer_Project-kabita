const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Environment Configuration Manager for Teacher Panel
 */
const envConfig = {
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server Configuration
  PORT: parseInt(process.env.PORT, 10) || 3000,
  
  // MongoDB Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'Jatiya_Yuva_Computer',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'dev_teacher_jwt_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Bcrypt Configuration
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  
  // QR Code Configuration
  QR_CODE_SIZE: parseInt(process.env.QR_CODE_SIZE, 10) || 200,
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: parseInt(process.env.MAX_VIDEO_SIZE, 10) || 100 * 1024 * 1024, // 100MB
};

const validateEnv = () => {
  const missingVars = [];
  
  if (!envConfig.MONGODB_URI || envConfig.MONGODB_URI.trim() === '') {
    missingVars.push('MONGODB_URI');
  }
  if (!envConfig.JWT_SECRET || envConfig.JWT_SECRET.trim() === '') {
    missingVars.push('JWT_SECRET');
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env file.`
    );
  }
};

const get = (key) => {
  if (!(key in envConfig)) {
    throw new Error(`Environment variable "${key}" is not defined in config`);
  }
  return envConfig[key];
};

const isProduction = () => envConfig.NODE_ENV === 'production';
const isDevelopment = () => envConfig.NODE_ENV === 'development';

const getAll = () => {
  const config = { ...envConfig };
  if (config.JWT_SECRET) {
    config.JWT_SECRET = '***HIDDEN***';
  }
  return config;
};

// Validate on module load
try {
  validateEnv();
  console.log('✅ Teacher Panel environment variables validated successfully');
} catch (error) {
  console.error('❌ Teacher Panel environment validation failed:', error.message);
  if (isProduction()) {
    process.exit(1);
  } else {
    console.warn('⚠️  Continuing in development mode, but some features may not work');
  }
}

module.exports = {
  ...envConfig,
  get,
  isProduction,
  isDevelopment,
  getAll,
  validateEnv,
};

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Environment Configuration Manager
 * Centralized management and validation of all environment variables
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
  JWT_SECRET: process.env.JWT_SECRET || 'dev_superadmin_jwt_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  
  // Bcrypt Configuration
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  
  // AWS S3 Configuration
  AWS_REGION: process.env.AWS_REGION || 'eu-north-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || 'AKIA45SPDOFAN2M3TJUK',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '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',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'notes-market-bucket',
  
  // CORS Configuration (for future use)
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // API Configuration
  API_PREFIX: process.env.API_PREFIX || '/api',
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  
  // Clock Sync Check (set to true to skip clock sync check - NOT recommended, AWS will still reject if clock is off)
  SKIP_CLOCK_CHECK: process.env.SKIP_CLOCK_CHECK === 'true',
};

/**
 * Required environment variables
 */
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

/**
 * Validate required environment variables
 * @throws {Error} If any required variable is missing
 */
const validateEnv = () => {
  const missingVars = [];
  
  requiredEnvVars.forEach((varName) => {
    if (!envConfig[varName] || envConfig[varName].trim() === '') {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env file in the SuperAdmin folder.`
    );
  }
  
  // Validate JWT_SECRET strength in production
  if (envConfig.NODE_ENV === 'production') {
    if (envConfig.JWT_SECRET.length < 32) {
      console.warn(
        '⚠️  WARNING: JWT_SECRET should be at least 32 characters long in production!'
      );
    }
    if (envConfig.JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production') {
      throw new Error(
        'JWT_SECRET must be changed from default value in production environment!'
      );
    }
  }
  
  // Validate MongoDB URI format
  if (!envConfig.MONGODB_URI.startsWith('mongodb://') && 
      !envConfig.MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error(
      'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"'
    );
  }
  
  // Validate PORT range
  if (envConfig.PORT < 1 || envConfig.PORT > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }
  
  // Validate BCRYPT_SALT_ROUNDS
  if (envConfig.BCRYPT_SALT_ROUNDS < 10 || envConfig.BCRYPT_SALT_ROUNDS > 15) {
    console.warn(
      '⚠️  WARNING: BCRYPT_SALT_ROUNDS should be between 10 and 15 for optimal security and performance'
    );
  }
};

/**
 * Get environment variable value
 * @param {string} key - Environment variable key
 * @returns {any} Environment variable value
 */
const get = (key) => {
  if (!(key in envConfig)) {
    throw new Error(`Environment variable "${key}" is not defined in config`);
  }
  return envConfig[key];
};

/**
 * Check if running in production
 * @returns {boolean}
 */
const isProduction = () => {
  return envConfig.NODE_ENV === 'production';
};

/**
 * Check if running in development
 * @returns {boolean}
 */
const isDevelopment = () => {
  return envConfig.NODE_ENV === 'development';
};

/**
 * Get all configuration (for debugging, excludes sensitive data)
 * @returns {object} Configuration object
 */
const getAll = () => {
  const config = { ...envConfig };
  // Don't expose sensitive data
  if (config.JWT_SECRET) {
    config.JWT_SECRET = '***HIDDEN***';
  }
  return config;
};

// Validate on module load
try {
  validateEnv();
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
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


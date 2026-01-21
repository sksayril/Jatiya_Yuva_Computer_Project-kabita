const jwt = require('jsonwebtoken');
const config = require('../config/env.config');

/**
 * Resolve a safe JWT expiry value.
 * Falls back to 7d if config is missing or zero.
 */
const resolveExpiresIn = () => {
  const exp = config.JWT_EXPIRES_IN;
  if (!exp) return '7d';
  if (typeof exp === 'number') {
    return exp > 0 ? exp : '7d';
  }
  const normalized = String(exp).trim();
  if (
    normalized === '' ||
    normalized === '0' ||
    normalized === '0s' ||
    normalized === '0m' ||
    normalized === '0h' ||
    normalized === '0d'
  ) {
    return '7d';
  }
  return normalized;
};

/**
 * Get JWT Secret - ensures it's loaded correctly
 */
const getJWTSecret = () => {
  const secret = config.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET in your .env file.');
  }
  return secret;
};

/**
 * Generate JWT token for Super Admin
 * @param {Object} payload - Token payload containing id and role
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  const secret = getJWTSecret();
  
  // Log in development for debugging
  if (config.isDevelopment()) {
    console.log('🔑 Generating token with secret length:', secret.length);
  }
  
  return jwt.sign(payload, secret, {
    expiresIn: resolveExpiresIn(),
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid, expired, or secret doesn't match
 */
const verifyToken = (token) => {
  try {
    const secret = getJWTSecret();
    
    // Log in development for debugging
    if (config.isDevelopment()) {
      console.log('🔍 Verifying token with secret length:', secret.length);
    }
    
    // Verify token with secret
    const decoded = jwt.verify(token, secret);
    
    // Additional validation: check if decoded payload has required fields
    if (!decoded.id || !decoded.role) {
      throw new Error('Token payload is missing required fields (id or role)');
    }
    
    return decoded;
  } catch (error) {
    // Enhance error messages for debugging
    if (error.name === 'JsonWebTokenError') {
      // This usually means the secret doesn't match
      const errorMsg = error.message.includes('invalid signature') 
        ? 'Token signature is invalid. JWT_SECRET may have changed or token was signed with different secret.'
        : `Invalid token: ${error.message}`;
      throw new Error(errorMsg);
    } else if (error.name === 'TokenExpiredError') {
      throw new Error(`Token expired at: ${new Date(error.expiredAt).toISOString()}`);
    } else if (error.name === 'NotBeforeError') {
      throw new Error(`Token not active until: ${new Date(error.date).toISOString()}`);
    }
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};


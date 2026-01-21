const jwt = require('jsonwebtoken');
const config = require('../config/env.config');

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
 * Generate JWT token for Staff
 * @param {Object} payload - Token payload containing userId, role, and branchId
 * @returns {String} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: resolveExpiresIn(),
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};

const User = require('../../SuperAdmin/models/user.model');
const { generateToken } = require('../utils/jwt');
const config = require('../config/env.config');

/**
 * Admin Login
 * POST /api/admin/login
 * Supports login with email or adminId + password
 */
const login = async (req, res) => {
  try {
    const { email, adminId, password } = req.body;

    if (!password || (!email && !adminId)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: (email or adminId) and password are required',
      });
    }

    // Find user by email or adminId (assuming adminId might be stored somewhere)
    let user = null;
    if (email) {
      user = await User.findOne({ 
        email: email.toLowerCase().trim(),
        role: 'ADMIN'
      });
    } else if (adminId) {
      // If adminId is stored in a field, adjust accordingly
      // For now, assuming it might be email or a custom field
      user = await User.findOne({
        $or: [
          { email: adminId.toLowerCase().trim() },
          // Add other fields if adminId is stored elsewhere
        ],
        role: 'ADMIN'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled',
      });
    }

    // Verify password (plain text comparison for now, can be enhanced with bcrypt)
    if (password !== user.password) {
      // Check if password is hashed
      const bcrypt = require('bcrypt');
      const stored = String(user.password || '');
      if (stored.startsWith('$2') && (await bcrypt.compare(password, stored))) {
        // Password is hashed and matches
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
    }

    // Verify role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required',
      });
    }

    // Generate JWT token with branchId
    const payload = {
      userId: user._id.toString(),
      role: user.role,
      branchId: user.branchId.toString(),
    };
    const jwt_token = generateToken(payload);

    // Return token and user info
    res.status(200).json({
      success: true,
      jwt_token,
      role: user.role,
      branchId: user.branchId.toString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Admin Logout
 * POST /api/admin/logout
 */
const logout = async (req, res) => {
  try {
    // Stateless JWT logout: client should delete token
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  login,
  logout,
};

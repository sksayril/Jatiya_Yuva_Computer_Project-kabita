const bcrypt = require('bcrypt');
const SuperAdmin = require('../models/superAdmin.model');
const { generateToken } = require('../utils/jwt');
const config = require('../config/env.config');

/**
 * Super Admin Signup
 * POST /api/super-admin/signup
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, and password are required',
      });
    }

    // Check if email already exists
    const existingAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create SuperAdmin document
    const superAdmin = new SuperAdmin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'SUPER_ADMIN',
      isActive: true,
    });

    // Save to database
    await superAdmin.save();

    // Return success response (password is automatically excluded by toJSON method)
    res.status(201).json({
      success: true,
      message: 'Super Admin created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Super Admin Login
 * POST /api/auth/super-admin/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email and password are required',
      });
    }

    // Find SuperAdmin by email
    let superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (!superAdmin) {
      if (config.isDevelopment()) {
        const created = await SuperAdmin.create({
          name: 'System Owner',
          email: email.toLowerCase().trim(),
          password: password,
          role: 'SUPER_ADMIN',
          isActive: true,
        });
        superAdmin = created;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
    }

    // Check if account is active
    if (!superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled',
      });
    }

    // Compare password (plain text, with bcrypt migration if needed)
    if (password !== superAdmin.password) {
      const stored = String(superAdmin.password || '');
      if (stored.startsWith('$2') && (await bcrypt.compare(password, stored))) {
        superAdmin.password = password;
        await superAdmin.save();
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
    }

    // Generate JWT token
    const payload = {
      id: superAdmin._id.toString(),
      role: superAdmin.role,
    };
    const jwt_token = generateToken(payload);

    // Return token and role
    res.status(200).json({
      success: true,
      jwt_token,
      role: superAdmin.role,
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
 * Super Admin Logout
 * POST /api/super-admin/logout
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
  signup,
  login,
  logout,
};


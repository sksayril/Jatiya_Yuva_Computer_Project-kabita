const Staff = require('../../Admin/models/staff.model');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');
const config = require('../config/env.config');

/**
 * Staff Login
 * POST /api/staff/login
 * Supports login with Staff ID or Email + Password
 */
const login = async (req, res) => {
  try {
    const { staffId, email, password } = req.body;

    if (!password || (!email && !staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: (email or staffId) and password are required',
      });
    }

    // Find staff by email or staffId
    let staff = null;
    if (email) {
      staff = await Staff.findOne({ 
        email: email.toLowerCase().trim(),
        role: 'STAFF'
      });
    } else if (staffId) {
      staff = await Staff.findOne({
        staffId: staffId.toUpperCase().trim(),
        role: 'STAFF'
      });
    }

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!staff.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator',
      });
    }

    // Verify password
    const storedPassword = String(staff.loginCredentials?.password || '');
    let passwordMatch = false;

    if (storedPassword.startsWith('$2')) {
      // Password is hashed
      passwordMatch = await bcrypt.compare(password, storedPassword);
    } else {
      // Plain text password (for initial setup)
      passwordMatch = password === storedPassword;
    }

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify role
    if (staff.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff role required',
      });
    }

    // Generate JWT token with branchId
    const payload = {
      userId: staff._id.toString(),
      role: 'STAFF',
      branchId: staff.branchId.toString(),
    };

    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        role: 'STAFF',
        branchId: staff.branchId.toString(),
        staffId: staff.staffId,
        name: staff.name,
        email: staff.email,
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  login,
};

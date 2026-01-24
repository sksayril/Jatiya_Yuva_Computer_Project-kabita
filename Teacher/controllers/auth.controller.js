const Teacher = require('../../Admin/models/teacher.model');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');
const config = require('../config/env.config');

/**
 * Teacher Login
 * POST /api/teacher/login
 * Supports login with Teacher ID or Email + Password
 */
const login = async (req, res) => {
  try {
    const { teacherId, email, password, otp } = req.body;

    // OTP login (placeholder for future implementation)
    if (otp) {
      return res.status(501).json({
        success: false,
        message: 'OTP login is not yet implemented. Please use Teacher ID/Email + Password.',
      });
    }

    // Validate input
    if (!password || (!teacherId && !email)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: (teacherId or email) and password are required',
      });
    }

    // Find teacher by teacherId or email
    let teacher = null;
    if (teacherId) {
      teacher = await Teacher.findOne({
        teacherId: teacherId.toUpperCase().trim(),
      });
    } else if (email) {
      teacher = await Teacher.findOne({
        email: email.toLowerCase().trim(),
      });
    }

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!teacher.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator',
      });
    }

    // Verify password
    const storedPassword = String(teacher.loginCredentials?.password || '');
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

    // Generate JWT token with branchId and teacherId
    const payload = {
      userId: teacher._id.toString(),
      role: 'TEACHER',
      branchId: teacher.branchId.toString(),
      teacherId: teacher.teacherId,
    };

    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        role: 'TEACHER',
        branchId: teacher.branchId.toString(),
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
        assignedBatches: teacher.assignedBatches || [],
      },
    });
  } catch (error) {
    console.error('Teacher login error:', error);
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

const Student = require('../../Admin/models/student.model');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');
const config = require('../config/env.config');

/**
 * Student Login
 * POST /api/student/login
 * Supports login with Student ID, Mobile, or OTP (placeholder)
 */
const login = async (req, res) => {
  try {
    const { studentId, mobile, password, otp } = req.body;

    // OTP login (placeholder for future implementation)
    if (otp) {
      return res.status(501).json({
        success: false,
        message: 'OTP login is not yet implemented. Please use Student ID/Mobile + Password.',
      });
    }

    // Validate input
    if (!password || (!studentId && !mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: (studentId or mobile) and password are required',
      });
    }

    // Find student by studentId or mobile
    let student = null;
    if (studentId) {
      student = await Student.findOne({
        studentId: studentId.toUpperCase().trim(),
      });
    } else if (mobile) {
      student = await Student.findOne({
        $or: [
          { mobileNumber: mobile.trim() },
          { mobile: mobile.trim() },
        ],
      });
    }

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (student.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administrator',
      });
    }

    // Verify password
    const storedPassword = String(student.loginCredentials?.password || '');
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

    // Generate JWT token with studentId and branchId
    const payload = {
      userId: student._id.toString(),
      role: 'STUDENT',
      branchId: student.branchId.toString(),
      studentId: student.studentId,
    };

    const token = generateToken(payload);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        role: 'STUDENT',
        branchId: student.branchId.toString(),
        studentId: student.studentId,
        name: student.studentName || student.name,
        email: student.email,
        mobileNumber: student.mobileNumber || student.mobile,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
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

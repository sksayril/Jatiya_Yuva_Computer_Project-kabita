const Staff = require('../models/staff.model');
const Batch = require('../models/batch.model');
const { generateStaffId } = require('../utils/idGenerator');
const { generateQRCode } = require('../utils/qrGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Staff/Teacher
 * POST /api/admin/staff
 */
const createStaff = async (req, res) => {
  try {
    const branchId = req.branchId;
    const {
      name,
      email,
      mobile,
      role,
      assignedBatches,
      salaryType,
      salaryRate,
    } = req.body;

    if (!name || !email || !mobile || !role || !salaryType || salaryRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, mobile, role, salaryType, salaryRate',
      });
    }

    if (!['STAFF', 'TEACHER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed: STAFF, TEACHER',
      });
    }

    if (!['PER_CLASS', 'MONTHLY_FIXED', 'HOURLY'].includes(salaryType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salaryType. Allowed: PER_CLASS, MONTHLY_FIXED, HOURLY',
      });
    }

    // Check for duplicate email
    const existingStaff = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Get branch code for ID generation
    const Branch = require('../../SuperAdmin/models/branch.model');
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Generate Staff ID
    const staffId = await generateStaffId(branch.code, role, Staff);

    // Generate QR Code
    const qrData = JSON.stringify({
      staffId,
      branchId,
      name,
    });
    const qrCode = await generateQRCode(qrData);

    // Generate login credentials
    const loginEmail = email.toLowerCase().trim();
    const password = `STF${staffId.split('-')[2]}`; // Simple password generation

    // Verify assigned batches if provided
    if (assignedBatches && Array.isArray(assignedBatches) && assignedBatches.length > 0) {
      const batches = await Batch.find({
        _id: { $in: assignedBatches },
        branchId,
      });
      if (batches.length !== assignedBatches.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more batches not found or belong to different branch',
        });
      }
    }

    // Create staff
    const staff = await Staff.create({
      branchId,
      staffId,
      name: name.trim(),
      email: loginEmail,
      mobile: mobile.trim(),
      role,
      assignedBatches: assignedBatches || [],
      salaryType,
      salaryRate: Number(salaryRate),
      currentMonthClasses: 0,
      currentMonthSalary: 0,
      qrCode,
      isActive: true,
      loginCredentials: {
        email: loginEmail,
        password,
      },
    });

    // Update batches with teacher assignment if teacher
    if (role === 'TEACHER' && assignedBatches && assignedBatches.length > 0) {
      await Batch.updateMany(
        { _id: { $in: assignedBatches } },
        { $set: { teacherId: staff._id } }
      );
    }

    // Generate ID card (placeholder)
    // TODO: Implement ID card generation
    const idCardUrl = '';

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'STAFF',
      entityId: staff._id,
      newData: { staffId, name, role, salaryType },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: {
        ...staff.toObject(),
        idCardUrl,
      },
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating staff',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Staff
 * GET /api/admin/staff
 */
const getStaff = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { role, isActive } = req.query;

    const query = { branchId };
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const staff = await Staff.find(query)
      .populate('assignedBatches', 'name timeSlot')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Calculate Staff Salary
 * Helper function to calculate salary based on attendance
 */
const calculateStaffSalary = async (staffId, month, year) => {
  const staff = await Staff.findById(staffId);
  if (!staff) return 0;

  const { StaffAttendance } = require('../models/attendance.model');
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  let salary = 0;

  if (staff.salaryType === 'PER_CLASS') {
    const classes = await StaffAttendance.countDocuments({
      staffId,
      date: { $gte: monthStart, $lte: monthEnd },
      status: 'Present',
    });
    salary = classes * staff.salaryRate;
  } else if (staff.salaryType === 'MONTHLY_FIXED') {
    salary = staff.salaryRate;
  } else if (staff.salaryType === 'HOURLY') {
    // Calculate hours from attendance records
    // TODO: Implement hourly calculation based on check-in/check-out times
    salary = 0; // Placeholder
  }

  // Update staff record
  await Staff.findByIdAndUpdate(staffId, {
    currentMonthClasses: staff.salaryType === 'PER_CLASS' ? 
      await StaffAttendance.countDocuments({
        staffId,
        date: { $gte: monthStart, $lte: monthEnd },
        status: 'Present',
      }) : staff.currentMonthClasses,
    currentMonthSalary: salary,
  });

  return salary;
};

module.exports = {
  createStaff,
  getStaff,
  calculateStaffSalary,
};

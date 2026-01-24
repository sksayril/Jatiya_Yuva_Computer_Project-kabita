const Staff = require('../models/staff.model');
const Teacher = require('../models/teacher.model');
const Batch = require('../models/batch.model');
const { generateStaffId, generateTeacherId } = require('../utils/idGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Staff (STAFF only - Teachers use separate endpoint)
 * POST /api/admin/staff
 */
const createStaff = async (req, res) => {
  try {
    const branchId = req.branchId;
    const {
      name,
      email,
      mobile,
      assignedBatches,
      salaryType,
      salaryRate,
    } = req.body;

    if (!name || !email || !mobile || !salaryType || salaryRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, mobile, salaryType, salaryRate',
      });
    }

    if (salaryType !== 'MONTHLY_FIXED') {
      return res.status(400).json({
        success: false,
        message: 'Invalid salaryType. Only MONTHLY_FIXED is allowed for staff',
      });
    }

    // Check for duplicate email (check both Staff and Teacher models)
    const existingStaff = await Staff.findOne({ email: email.toLowerCase().trim() });
    const existingTeacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
    if (existingStaff || existingTeacher) {
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

    // Generate Staff ID (role is always STAFF for this endpoint)
    const staffId = await generateStaffId(branch.code, 'STAFF', Staff);

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

    // Create staff (role is always STAFF)
    const staff = await Staff.create({
      branchId,
      staffId,
      name: name.trim(),
      email: loginEmail,
      mobile: mobile.trim(),
      role: 'STAFF',
      assignedBatches: assignedBatches || [],
      salaryType,
      salaryRate: Number(salaryRate),
      currentMonthClasses: 0,
      currentMonthSalary: 0,
      isActive: true,
      loginCredentials: {
        email: loginEmail,
        password,
      },
    });

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
      newData: { staffId, name, role: 'STAFF', salaryType },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Remove qrCode from response
    const staffData = staff.toObject();
    delete staffData.qrCode;

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: {
        ...staffData,
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

/**
 * Create Teacher (Dedicated Endpoint)
 * POST /api/admin/teachers
 */
const createTeacher = async (req, res) => {
  try {
    const branchId = req.branchId;
    const {
      name,
      email,
      mobile,
      assignedBatches,
      salaryType,
      salaryRate,
    } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !salaryType || salaryRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, mobile, salaryType, salaryRate',
      });
    }

    // assignedBatches is optional - validate only if provided
    if (assignedBatches && (!Array.isArray(assignedBatches) || assignedBatches.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'assignedBatches must be an array with at least one batch ID if provided',
      });
    }

    // Validate salary type
    if (!['PER_CLASS', 'MONTHLY_FIXED', 'HOURLY'].includes(salaryType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salaryType. Allowed: PER_CLASS, MONTHLY_FIXED, HOURLY',
      });
    }

    // Check for duplicate email (check both Staff and Teacher models)
    const existingStaff = await Staff.findOne({ email: email.toLowerCase().trim() });
    const existingTeacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
    if (existingStaff || existingTeacher) {
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

    // Verify all assigned batches exist and belong to the branch (if provided)
    if (assignedBatches && assignedBatches.length > 0) {
      const batches = await Batch.find({
        _id: { $in: assignedBatches },
        branchId,
        isActive: true,
      });

      if (batches.length !== assignedBatches.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more batches not found, inactive, or belong to different branch',
          details: `Found ${batches.length} valid batches out of ${assignedBatches.length} provided`,
        });
      }
    }

    // Generate Teacher ID
    const teacherId = await generateTeacherId(branch.code, Teacher);

    // Generate login credentials
    const loginEmail = email.toLowerCase().trim();
    const password = `TCH${teacherId.split('-')[2] || Math.random().toString(36).substring(7)}`;

    // Create teacher in Teacher model (without QR code)
    const teacher = await Teacher.create({
      branchId,
      teacherId,
      name: name.trim(),
      email: loginEmail,
      mobile: mobile.trim(),
      assignedBatches: assignedBatches || [],
      salaryType,
      salaryRate: Number(salaryRate),
      currentMonthClasses: 0,
      currentMonthSalary: 0,
      isActive: true,
      loginCredentials: {
        email: loginEmail,
        password,
      },
    });

    // Update batches with teacher assignment (if batches are provided)
    if (assignedBatches && assignedBatches.length > 0) {
      await Batch.updateMany(
        { _id: { $in: assignedBatches } },
        { $set: { teacherId: teacher._id } }
      );
    }

    // Log the action
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'TEACHER',
      entityId: teacher._id,
      newData: { teacherId, name, salaryType, assignedBatches },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        _id: teacher._id,
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
        mobile: teacher.mobile,
        assignedBatches: teacher.assignedBatches,
        salaryType: teacher.salaryType,
        salaryRate: teacher.salaryRate,
        loginCredentials: teacher.loginCredentials,
        isActive: teacher.isActive,
        createdAt: teacher.createdAt,
      },
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating teacher',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get All Teachers
 * GET /api/admin/teachers
 */
const getTeachers = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { isActive } = req.query;

    const query = { branchId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const teachers = await Teacher.find(query)
      .populate('assignedBatches', 'name timeSlot courseId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teachers',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Teacher by ID
 * GET /api/admin/teachers/:id
 */
const getTeacherById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const teacher = await Teacher.findOne({ _id: id, branchId })
      .populate('assignedBatches', 'name timeSlot courseId')
      .populate('branchId', 'name code');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Teacher
 * PATCH /api/admin/teachers/:id
 */
const updateTeacher = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const {
      name,
      email,
      mobile,
      assignedBatches,
      salaryType,
      salaryRate,
      isActive,
    } = req.body;

    const teacher = await Teacher.findOne({ _id: id, branchId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const oldData = {
      name: teacher.name,
      email: teacher.email,
      mobile: teacher.mobile,
      assignedBatches: teacher.assignedBatches,
      salaryType: teacher.salaryType,
      salaryRate: teacher.salaryRate,
      isActive: teacher.isActive,
    };

    // Update fields if provided
    if (name !== undefined) teacher.name = name.trim();
    if (email !== undefined) {
      const newEmail = email.toLowerCase().trim();
      // Check for duplicate email (excluding current teacher)
      const existingTeacher = await Teacher.findOne({
        email: newEmail,
        _id: { $ne: id },
      });
      const existingStaff = await Staff.findOne({ email: newEmail });
      if (existingTeacher || existingStaff) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }
      teacher.email = newEmail;
      if (teacher.loginCredentials) {
        teacher.loginCredentials.email = newEmail;
      }
    }
    if (mobile !== undefined) teacher.mobile = mobile.trim();
    if (salaryType !== undefined) {
      if (!['PER_CLASS', 'MONTHLY_FIXED', 'HOURLY'].includes(salaryType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid salaryType. Allowed: PER_CLASS, MONTHLY_FIXED, HOURLY',
        });
      }
      teacher.salaryType = salaryType;
    }
    if (salaryRate !== undefined) teacher.salaryRate = Number(salaryRate);
    if (isActive !== undefined) teacher.isActive = isActive;

    // Handle assigned batches update
    if (assignedBatches !== undefined) {
      if (!Array.isArray(assignedBatches)) {
        return res.status(400).json({
          success: false,
          message: 'assignedBatches must be an array',
        });
      }

      // If batches are provided, validate them
      if (assignedBatches.length > 0) {
        const batches = await Batch.find({
          _id: { $in: assignedBatches },
          branchId,
          isActive: true,
        });

        if (batches.length !== assignedBatches.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more batches not found, inactive, or belong to different branch',
          });
        }
      }

      const oldBatches = teacher.assignedBatches.map(b => b.toString());
      const newBatches = assignedBatches.map(b => b.toString());

      // Update teacher's assigned batches
      teacher.assignedBatches = assignedBatches;

      // Update batch teacher assignments
      // Remove teacher from old batches that are no longer assigned
      const batchesToRemove = oldBatches.filter(b => !newBatches.includes(b));
      if (batchesToRemove.length > 0) {
        await Batch.updateMany(
          { _id: { $in: batchesToRemove } },
          { $unset: { teacherId: '' } }
        );
      }

      // Add teacher to new batches
      const batchesToAdd = newBatches.filter(b => !oldBatches.includes(b));
      if (batchesToAdd.length > 0) {
        await Batch.updateMany(
          { _id: { $in: batchesToAdd } },
          { $set: { teacherId: teacher._id } }
        );
      }
    }

    await teacher.save();

    // Log the action
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'TEACHER',
      entityId: teacher._id,
      oldData,
      newData: {
        name: teacher.name,
        email: teacher.email,
        mobile: teacher.mobile,
        assignedBatches: teacher.assignedBatches,
        salaryType: teacher.salaryType,
        salaryRate: teacher.salaryRate,
        isActive: teacher.isActive,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher,
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating teacher',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Teacher
 * DELETE /api/admin/teachers/:id
 */
const deleteTeacher = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const teacher = await Teacher.findOne({ _id: id, branchId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Remove teacher from assigned batches
    if (teacher.assignedBatches && teacher.assignedBatches.length > 0) {
      await Batch.updateMany(
        { _id: { $in: teacher.assignedBatches } },
        { $unset: { teacherId: '' } }
      );
    }

    // Delete teacher
    await Teacher.findByIdAndDelete(id);

    // Log the action
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'TEACHER',
      entityId: id,
      oldData: {
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting teacher',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createStaff,
  createTeacher,
  getStaff,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  calculateStaffSalary,
};

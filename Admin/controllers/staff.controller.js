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
      salaryType,
      salaryRate,
      password,
    } = req.body;

    if (!name || !email || !mobile || !salaryType || salaryRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, mobile, salaryType, salaryRate',
      });
    }

    // Password is required
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (salaryType !== 'MONTHLY_FIXED') {
      return res.status(400).json({
        success: false,
        message: 'Invalid salaryType. Only MONTHLY_FIXED is allowed for staff',
      });
    }

    // Check for duplicate email within the same branch (check both Staff and Teacher models)
    const existingStaff = await Staff.findOne({ 
      email: email.toLowerCase().trim(),
      branchId: branchId 
    });
    const existingTeacher = await Teacher.findOne({ 
      email: email.toLowerCase().trim(),
      branchId: branchId 
    });
    if (existingStaff || existingTeacher) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered in this branch',
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

    // Use provided password (required)
    const loginEmail = email.toLowerCase().trim();
    const staffPassword = password;

    // Handle staff image upload (if provided)
    const staffImageFile = req.file;
    let imageUrl = '';
    if (staffImageFile) {
      // multer-s3 provides location as full S3 URL
      // Format: https://bucket-name.s3.region.amazonaws.com/staff/filename
      imageUrl = staffImageFile.location || staffImageFile.path || '';
      
      // Verify file was uploaded successfully
      if (!imageUrl) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload staff image. Please check your S3 configuration.',
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
      salaryType,
      salaryRate: Number(salaryRate),
      imageUrl: imageUrl || '',
      isActive: true,
      originalPassword: staffPassword, // Store original password for Admin visibility
      loginCredentials: {
        email: loginEmail,
        password: staffPassword,
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

    // Get staff with originalPassword
    const staffData = await Staff.findById(staff._id).select('+originalPassword');

    // Remove qrCode and idCardUrl from response
    const responseData = staffData.toObject();
    delete responseData.qrCode;
    delete responseData.idCardUrl;
    delete responseData.loginCredentials;
    delete responseData.originalPassword;
    
    // Add password to response
    responseData.password = staffData.originalPassword;
    
    // Include imageUrl in response
    responseData.imageUrl = staffData.imageUrl || '';

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: responseData,
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
      .select('+originalPassword')
      .sort({ createdAt: -1 });

    // Map staff to include password in response
    const staffList = staff.map(s => {
      const staffData = s.toObject();
      delete staffData.qrCode;
      delete staffData.idCardUrl;
      delete staffData.loginCredentials;
      staffData.password = s.originalPassword || null;
      delete staffData.originalPassword;
      return staffData;
    });

    res.status(200).json({
      success: true,
      data: staffList,
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

  return salary;
};

/**
 * Create Teacher (Dedicated Endpoint)
 * POST /api/admin/teachers
 */
const createTeacher = async (req, res) => {
  try {
    const branchId = req.branchId;
    let {
      name,
      email,
      mobile,
      assignedBatches,
      salaryType,
      salaryRate,
      password,
    } = req.body;

    // Parse assignedBatches if it's a string (from form-data)
    if (typeof assignedBatches === 'string') {
      try {
        assignedBatches = assignedBatches ? JSON.parse(assignedBatches) : [];
      } catch (e) {
        assignedBatches = [];
      }
    }

    // Validate required fields
    if (!name || !email || !mobile || !salaryType || salaryRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, mobile, salaryType, salaryRate',
      });
    }

    // Password is required
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    // assignedBatches is optional - validate only if provided
    if (assignedBatches !== undefined && !Array.isArray(assignedBatches)) {
      return res.status(400).json({
        success: false,
        message: 'assignedBatches must be an array',
      });
    }

    // Validate salary type
    if (!['PER_CLASS', 'MONTHLY_FIXED', 'HOURLY'].includes(salaryType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salaryType. Allowed: PER_CLASS, MONTHLY_FIXED, HOURLY',
      });
    }

    // Check for duplicate email within the same branch (check both Staff and Teacher models)
    const existingStaff = await Staff.findOne({ 
      email: email.toLowerCase().trim(),
      branchId: branchId 
    });
    const existingTeacher = await Teacher.findOne({ 
      email: email.toLowerCase().trim(),
      branchId: branchId 
    });
    if (existingStaff || existingTeacher) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered in this branch',
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

    // Use provided password (required)
    const loginEmail = email.toLowerCase().trim();
    const teacherPassword = password;

    // Handle teacher image upload (if provided)
    const teacherImageFile = req.file;
    let imageUrl = '';
    if (teacherImageFile) {
      // multer-s3 provides location as full S3 URL
      // Format: https://bucket-name.s3.region.amazonaws.com/teachers/filename
      imageUrl = teacherImageFile.location || teacherImageFile.path || '';
      
      // Verify file was uploaded successfully
      if (!imageUrl) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload teacher image. Please check your S3 configuration.',
        });
      }
    }

    // Ensure branchId is set from authenticated admin (prevent override)
    const teacherBranchId = req.branchId || branchId;
    
    // Create teacher in Teacher model (without QR code)
    // branchId is automatically set from authenticated admin's branch
    const teacher = await Teacher.create({
      branchId: teacherBranchId, // Always use authenticated admin's branchId
      teacherId,
      name: name.trim(),
      email: loginEmail,
      mobile: mobile.trim(),
      assignedBatches: assignedBatches && Array.isArray(assignedBatches) ? assignedBatches : [],
      salaryType,
      salaryRate: Number(salaryRate),
      currentMonthClasses: 0,
      currentMonthSalary: 0,
      imageUrl: imageUrl || '',
      isActive: true,
      originalPassword: teacherPassword, // Store original password for Admin visibility
      loginCredentials: {
        email: loginEmail,
        password: teacherPassword,
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

    // Get teacher with originalPassword
    const teacherData = await Teacher.findById(teacher._id).select('+originalPassword');
    
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        _id: teacherData._id,
        teacherId: teacherData.teacherId,
        name: teacherData.name,
        email: teacherData.email,
        mobile: teacherData.mobile,
        assignedBatches: teacherData.assignedBatches,
        salaryType: teacherData.salaryType,
        salaryRate: teacherData.salaryRate,
        imageUrl: teacherData.imageUrl || '',
        password: teacherData.originalPassword, // Include original password in response
        isActive: teacherData.isActive,
        createdAt: teacherData.createdAt,
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
      .select('+originalPassword')
      .populate('assignedBatches', 'name timeSlot courseId')
      .sort({ createdAt: -1 });

    // Map teachers to include password in response
    const teachersData = teachers.map(teacher => {
      const teacherObj = teacher.toObject();
      teacherObj.password = teacher.originalPassword || null;
      // Remove loginCredentials as we're using password directly
      delete teacherObj.loginCredentials;
      delete teacherObj.originalPassword;
      return teacherObj;
    });

    res.status(200).json({
      success: true,
      count: teachersData.length,
      data: teachersData,
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
      .select('+originalPassword')
      .populate('assignedBatches', 'name timeSlot courseId')
      .populate('branchId', 'name code');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const teacherData = teacher.toObject();
    teacherData.password = teacher.originalPassword || null;
    // Remove loginCredentials as we're using password directly
    delete teacherData.loginCredentials;
    delete teacherData.originalPassword;

    res.status(200).json({
      success: true,
      data: teacherData,
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
      // Check for duplicate email within the same branch (excluding current teacher)
      const existingTeacher = await Teacher.findOne({
        email: newEmail,
        branchId: branchId,
        _id: { $ne: id },
      });
      const existingStaff = await Staff.findOne({ 
        email: newEmail,
        branchId: branchId 
      });
      if (existingTeacher || existingStaff) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered in this branch',
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

/**
 * Get Staff by ID
 * GET /api/admin/staff/:id
 */
const getStaffById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const staff = await Staff.findOne({ _id: id, branchId })
      .select('+originalPassword');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // Remove qrCode and idCardUrl from response
    const staffData = staff.toObject();
    delete staffData.qrCode;
    delete staffData.idCardUrl;
    delete staffData.loginCredentials;
    staffData.password = staff.originalPassword || null;
    delete staffData.originalPassword;

    res.status(200).json({
      success: true,
      data: staffData,
    });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Staff
 * PATCH /api/admin/staff/:id
 */
const updateStaff = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const {
      name,
      email,
      mobile,
      salaryType,
      salaryRate,
      isActive,
    } = req.body;

    // Find staff
    const staff = await Staff.findOne({ _id: id, branchId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // Store old data for audit log
    const oldData = {
      name: staff.name,
      email: staff.email,
      mobile: staff.mobile,
      salaryType: staff.salaryType,
      salaryRate: staff.salaryRate,
      isActive: staff.isActive,
    };

    // Update fields if provided
    if (name !== undefined) staff.name = name.trim();
    
    if (email !== undefined) {
      const newEmail = email.toLowerCase().trim();
      // Check for duplicate email within the same branch (excluding current staff)
      const existingStaff = await Staff.findOne({
        email: newEmail,
        branchId: branchId,
        _id: { $ne: id },
      });
      const existingTeacher = await Teacher.findOne({ 
        email: newEmail,
        branchId: branchId 
      });
      if (existingStaff || existingTeacher) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered in this branch',
        });
      }
      staff.email = newEmail;
      if (staff.loginCredentials) {
        staff.loginCredentials.email = newEmail;
      }
    }

    if (mobile !== undefined) staff.mobile = mobile.trim();

    if (salaryType !== undefined) {
      if (salaryType !== 'MONTHLY_FIXED') {
        return res.status(400).json({
          success: false,
          message: 'Invalid salaryType. Only MONTHLY_FIXED is allowed for staff',
        });
      }
      staff.salaryType = salaryType;
    }

    if (salaryRate !== undefined) staff.salaryRate = Number(salaryRate);
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    // Log the action
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'STAFF',
      entityId: staff._id,
      oldData,
      newData: {
        name: staff.name,
        email: staff.email,
        mobile: staff.mobile,
        salaryType: staff.salaryType,
        salaryRate: staff.salaryRate,
        isActive: staff.isActive,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Get updated staff with originalPassword
    const updatedStaff = await Staff.findById(staff._id).select('+originalPassword');

    // Remove qrCode and idCardUrl from response
    const staffData = updatedStaff.toObject();
    delete staffData.qrCode;
    delete staffData.idCardUrl;
    delete staffData.loginCredentials;
    staffData.password = updatedStaff.originalPassword || null;
    delete staffData.originalPassword;

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      data: staffData,
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating staff',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Staff
 * DELETE /api/admin/staff/:id
 */
const deleteStaff = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Find staff
    const staff = await Staff.findOne({ _id: id, branchId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // Store staff data for audit log before deletion
    const deletedData = {
      staffId: staff.staffId,
      name: staff.name,
      email: staff.email,
      role: staff.role,
    };

    // Delete staff
    await Staff.findByIdAndDelete(id);

    // Log the action
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'STAFF',
      entityId: id,
      oldData: deletedData,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting staff',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createStaff,
  createTeacher,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  calculateStaffSalary,
};

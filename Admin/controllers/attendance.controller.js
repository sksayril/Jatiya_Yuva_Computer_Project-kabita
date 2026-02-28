const { StudentAttendance, StaffAttendance } = require('../models/attendance.model');
const Student = require('../models/student.model');
const Staff = require('../models/staff.model');
const Teacher = require('../models/teacher.model');
const Batch = require('../models/batch.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Mark Student Attendance
 * POST /api/admin/attendance/student
 * Methods: QR, FACE (placeholder), MANUAL
 */
const markStudentAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { studentId, date, timeSlot, method, qrData, inTime, outTime } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, date',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get batchId from student record
    const batchId = student.batchId;
    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: 'Student is not assigned to any batch',
      });
    }

    // Get batch for timeSlot and other batch info
    const batch = await Batch.findOne({ _id: batchId, branchId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Student batch not found' });
    }

    // Check if student is active
    if (student.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Student is not active',
      });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.studentId !== student.studentId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Check for duplicate attendance on same date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const existingAttendance = await StudentAttendance.findOne({
      branchId,
      studentId: student._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this date',
        data: existingAttendance,
      });
    }

    // Check batch limit (if applicable)
    const batchAttendanceCount = await StudentAttendance.countDocuments({
      branchId,
      batchId,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
      status: 'Present',
    });

    if (batch.maxStudents && batchAttendanceCount >= batch.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Batch attendance limit reached',
      });
    }

    // Determine status (Present by default, can be Late if time-based logic applies)
    let status = 'Present';
    // TODO: Add late detection logic based on timeSlot

    // Create attendance record
    const attendance = await StudentAttendance.create({
      branchId,
      studentId: student._id,
      batchId,
      date: attendanceDate,
      timeSlot: timeSlot || batch.timeSlot,
      inTime: inTime ? new Date(inTime) : new Date(),
      outTime: outTime ? new Date(outTime) : null,
      status,
      method: method || 'MANUAL',
      markedBy: req.user.id,
    });

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'STUDENT_ATTENDANCE',
      entityId: attendance._id,
      newData: { studentId: student.studentId, status, method },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Student attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Mark student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Staff Attendance
 * POST /api/admin/attendance/staff
 */
const markStaffAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { staffId, date, method, qrData, checkIn, checkOut } = req.body;

    if (!staffId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: staffId, date',
      });
    }

    // Verify staff belongs to branch
    const staff = await Staff.findOne({ staffId, branchId });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    // Check if staff is active
    if (!staff.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Staff is not active',
      });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.staffId !== staff.staffId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Check for duplicate attendance on same date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const existingAttendance = await StaffAttendance.findOne({
      branchId,
      staffId: staff._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (existingAttendance) {
      // Update check-out time if checking out
      if (!existingAttendance.checkOut) {
        existingAttendance.checkOut = new Date();
        await existingAttendance.save();
        return res.status(200).json({
          success: true,
          message: 'Staff check-out recorded',
          data: existingAttendance,
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this date',
        data: existingAttendance,
      });
    }

    // Create attendance record with check-in
    const attendance = await StaffAttendance.create({
      branchId,
      staffId: staff._id,
      date: attendanceDate,
      checkIn: checkIn ? new Date(checkIn) : new Date(),
      checkOut: checkOut ? new Date(checkOut) : null,
      status: 'Present',
      method: method || 'MANUAL',
      markedBy: req.user.id,
    });

    // Update staff class count if teacher
    if (staff.role === 'TEACHER' && staff.salaryType === 'PER_CLASS') {
      await Staff.findByIdAndUpdate(staff._id, {
        $inc: { currentMonthClasses: 1 },
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'STAFF_ATTENDANCE',
      entityId: attendance._id,
      newData: { staffId: staff.staffId, status: 'Present', method },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Staff attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Mark staff attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking staff attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Student Attendance
 * GET /api/admin/attendance/student
 */
const getStudentAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { studentId, batchId, date, startDate, endDate } = req.query;

    const query = { branchId };
    
    // Handle studentId - could be ObjectId or string studentId
    if (studentId) {
      if (mongoose.Types.ObjectId.isValid(studentId) && studentId.length === 24) {
        // It's a valid ObjectId, use directly
        query.studentId = studentId;
      } else {
        // It's a string studentId (e.g., "YUVA-0002-2026-001"), find the student first
        const student = await Student.findOne({ 
          studentId: studentId.toUpperCase().trim(), 
          branchId 
        });
        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Student not found',
          });
        }
        query.studentId = student._id;
      }
    }
    
    if (batchId) query.batchId = batchId;

    // Handle date filtering
    if (date) {
      // Single date filter
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      const attendanceDateEnd = new Date(attendanceDate);
      attendanceDateEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: attendanceDate, $lte: attendanceDateEnd };
    } else if (startDate || endDate) {
      // Date range filter
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendance = await StudentAttendance.find(query)
      .populate('studentId', 'studentId name')
      .populate('batchId', 'name timeSlot')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Staff Attendance
 * GET /api/admin/attendance/staff
 */
const getStaffAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { staffId, date, startDate, endDate } = req.query;

    const query = { branchId };
    
    // Handle staffId - could be ObjectId or string staffId
    if (staffId) {
      if (mongoose.Types.ObjectId.isValid(staffId) && staffId.length === 24) {
        // It's a valid ObjectId, use directly
        query.staffId = staffId;
      } else {
        // It's a string staffId (e.g., "DHK001-STF-001"), find the staff first
        const staff = await Staff.findOne({ 
          staffId: staffId.toUpperCase().trim(), 
          branchId 
        });
        if (!staff) {
          return res.status(404).json({
            success: false,
            message: 'Staff not found',
          });
        }
        query.staffId = staff._id;
      }
    }

    // Handle date filtering
    if (date) {
      // Single date filter
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      const attendanceDateEnd = new Date(attendanceDate);
      attendanceDateEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: attendanceDate, $lte: attendanceDateEnd };
    } else if (startDate || endDate) {
      // Date range filter
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendance = await StaffAttendance.find(query)
      .populate('staffId', 'staffId name role')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get staff attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Teacher Attendance
 * POST /api/admin/attendance/teacher
 * Mark attendance for teachers only (staff with role 'TEACHER')
 */
const markTeacherAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { teacherId, date, method, qrData, checkIn, checkOut, timeSlot } = req.body;

    if (!teacherId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: teacherId, date',
      });
    }

    // Verify teacher belongs to branch - check Teacher model first
    let teacher;
    if (mongoose.Types.ObjectId.isValid(teacherId) && teacherId.length === 24) {
      teacher = await Teacher.findOne({ 
        _id: teacherId,
        branchId
      });
    } else {
      teacher = await Teacher.findOne({ 
        teacherId: teacherId.toUpperCase().trim(),
        branchId
      });
    }

    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }

    // Find or create corresponding Staff record for attendance tracking
    // StaffAttendance requires a Staff model reference
    let staffRecord = await Staff.findOne({
      email: teacher.email,
      branchId,
      role: 'TEACHER'
    });

    // If no Staff record exists, create one for attendance tracking
    if (!staffRecord) {
      staffRecord = await Staff.create({
        branchId: teacher.branchId,
        staffId: teacher.teacherId, // Use teacherId as staffId
        name: teacher.name,
        email: teacher.email,
        mobile: teacher.mobile,
        role: 'TEACHER',
        salaryType: teacher.salaryType,
        salaryRate: teacher.salaryRate,
        isActive: teacher.isActive,
      });
    }

    // Check if teacher is active
    if (!teacher.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is not active',
      });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.staffId !== teacher.teacherId && qrInfo.teacherId !== teacher.teacherId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Check for duplicate attendance on same date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const existingAttendance = await StaffAttendance.findOne({
      branchId,
      staffId: staffRecord._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (existingAttendance) {
      // Update check-out time if checking out
      if (!existingAttendance.checkOut && checkOut) {
        existingAttendance.checkOut = checkOut ? new Date(checkOut) : new Date();
        await existingAttendance.save();
        return res.status(200).json({
          success: true,
          message: 'Teacher check-out recorded',
          data: existingAttendance,
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this date',
        data: existingAttendance,
      });
    }

    // Create attendance record with check-in
    const attendance = await StaffAttendance.create({
      branchId,
      staffId: staffRecord._id,
      date: attendanceDate,
      timeSlot: timeSlot || null,
      checkIn: checkIn ? new Date(checkIn) : new Date(),
      checkOut: checkOut ? new Date(checkOut) : null,
      status: 'Present',
      method: method || 'MANUAL',
      markedBy: req.user.id,
    });

    // Update teacher class count if salary type is PER_CLASS
    if (teacher.salaryType === 'PER_CLASS') {
      await Teacher.findByIdAndUpdate(teacher._id, {
        $inc: { currentMonthClasses: 1 },
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'TEACHER_ATTENDANCE',
      entityId: attendance._id,
      newData: { teacherId: teacher.teacherId, status: 'Present', method },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Teacher attendance marked successfully',
      data: await attendance.populate('staffId', 'staffId name role email mobile'),
    });
  } catch (error) {
    console.error('Mark teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking teacher attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Teacher Check-In
 * POST /api/admin/attendance/teacher/check-in
 */
const markTeacherCheckIn = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { teacherId, date, timeSlot, method, qrData, checkIn } = req.body;

    if (!teacherId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: teacherId, date',
      });
    }

    // Verify teacher belongs to branch - check Teacher model first
    let teacher;
    if (mongoose.Types.ObjectId.isValid(teacherId) && teacherId.length === 24) {
      teacher = await Teacher.findOne({ 
        _id: teacherId,
        branchId
      });
    } else {
      teacher = await Teacher.findOne({ 
        teacherId: teacherId.toUpperCase().trim(),
        branchId
      });
    }

    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }

    // Find or create corresponding Staff record for attendance tracking
    // StaffAttendance requires a Staff model reference
    let staffRecord = await Staff.findOne({
      email: teacher.email,
      branchId,
      role: 'TEACHER'
    });

    // If no Staff record exists, create one for attendance tracking
    if (!staffRecord) {
      staffRecord = await Staff.create({
        branchId: teacher.branchId,
        staffId: teacher.teacherId, // Use teacherId as staffId
        name: teacher.name,
        email: teacher.email,
        mobile: teacher.mobile,
        role: 'TEACHER',
        salaryType: teacher.salaryType,
        salaryRate: teacher.salaryRate,
        isActive: teacher.isActive,
      });
    }

    // Check if teacher is active
    if (!teacher.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is not active',
      });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.staffId !== teacher.teacherId && qrInfo.teacherId !== teacher.teacherId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Check for existing attendance on same date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    let attendance = await StaffAttendance.findOne({
      branchId,
      staffId: staffRecord._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (attendance) {
      // Update check-in if attendance exists
      attendance.checkIn = checkIn ? new Date(checkIn) : new Date();
      if (timeSlot) attendance.timeSlot = timeSlot;
      attendance.method = method || attendance.method || 'MANUAL';
      await attendance.save();
    } else {
      // Create new attendance record with check-in only
      attendance = await StaffAttendance.create({
        branchId,
        staffId: staffRecord._id,
        date: attendanceDate,
        timeSlot: timeSlot || null,
        checkIn: checkIn ? new Date(checkIn) : new Date(),
        checkOut: null,
        status: 'Present',
        method: method || 'MANUAL',
        markedBy: req.user.id,
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'TEACHER_ATTENDANCE',
      entityId: attendance._id,
      newData: { teacherId: teacher.teacherId, checkIn: attendance.checkIn, method },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Teacher check-in marked successfully',
      data: await attendance.populate('staffId', 'staffId name role email mobile'),
    });
  } catch (error) {
    console.error('Mark teacher check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking teacher check-in',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Teacher Check-Out
 * POST /api/admin/attendance/teacher/check-out
 */
const markTeacherCheckOut = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { teacherId, date, checkOut, method, qrData } = req.body;

    if (!teacherId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: teacherId, date',
      });
    }

    // Verify teacher belongs to branch - check Teacher model first
    let teacher;
    if (mongoose.Types.ObjectId.isValid(teacherId) && teacherId.length === 24) {
      teacher = await Teacher.findOne({ 
        _id: teacherId,
        branchId
      });
    } else {
      teacher = await Teacher.findOne({ 
        teacherId: teacherId.toUpperCase().trim(),
        branchId
      });
    }

    if (!teacher) {
      return res.status(404).json({ 
        success: false, 
        message: 'Teacher not found' 
      });
    }

    // Find or create corresponding Staff record for attendance tracking
    // StaffAttendance requires a Staff model reference
    let staffRecord = await Staff.findOne({
      email: teacher.email,
      branchId,
      role: 'TEACHER'
    });

    // If no Staff record exists, create one for attendance tracking
    if (!staffRecord) {
      staffRecord = await Staff.create({
        branchId: teacher.branchId,
        staffId: teacher.teacherId, // Use teacherId as staffId
        name: teacher.name,
        email: teacher.email,
        mobile: teacher.mobile,
        role: 'TEACHER',
        salaryType: teacher.salaryType,
        salaryRate: teacher.salaryRate,
        isActive: teacher.isActive,
      });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.staffId !== teacher.staffId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Find existing attendance for the date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const attendance = await StaffAttendance.findOne({
      branchId,
      staffId: staffRecord._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'Check-in not marked for this date. Please mark check-in first.',
      });
    }

    // Update check-out
    attendance.checkOut = checkOut ? new Date(checkOut) : new Date();
    if (method) attendance.method = method;
    await attendance.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'TEACHER_ATTENDANCE',
      entityId: attendance._id,
      oldData: { checkOut: null },
      newData: { teacherId: teacher.teacherId, checkOut: attendance.checkOut },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Teacher check-out marked successfully',
      data: await attendance.populate('staffId', 'staffId name role email mobile'),
    });
  } catch (error) {
    console.error('Mark teacher check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking teacher check-out',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Teacher Attendance
 * GET /api/admin/attendance/teacher
 * Get attendance records for teachers only (staff with role 'TEACHER')
 * Uses aggregation for optimal performance with statistics
 */
const getTeacherAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { teacherId, date, startDate, endDate, page = 1, limit = 30 } = req.query;

    const branchObjectId = new mongoose.Types.ObjectId(branchId);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // First, get all teachers from Teacher model in this branch
    const teachers = await Teacher.find({
      branchId: branchObjectId,
      isActive: true,
    }).select('_id teacherId name email mobile branchId salaryType salaryRate isActive');

    if (teachers.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          attendance: [],
          statistics: {
            totalRecords: 0,
            totalTeachers: 0,
            present: 0,
            absent: 0,
            late: 0,
            attendancePercentage: 0,
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        },
      });
    }

    // Get corresponding Staff records for attendance tracking
    const teacherEmails = teachers.map(t => t.email);
    const staffRecords = await Staff.find({
      branchId: branchObjectId,
      email: { $in: teacherEmails },
      role: 'TEACHER'
    });

    // Get staff IDs for teachers (create Staff records if needed)
    const staffIds = [];
    for (const teacher of teachers) {
      let staffRecord = staffRecords.find(s => s.email === teacher.email);
      if (!staffRecord) {
        // Create Staff record for attendance tracking
        staffRecord = await Staff.create({
          branchId: teacher.branchId,
          staffId: teacher.teacherId,
          name: teacher.name,
          email: teacher.email,
          mobile: teacher.mobile,
          role: 'TEACHER',
          salaryType: teacher.salaryType,
          salaryRate: teacher.salaryRate,
          isActive: teacher.isActive,
        });
      }
      staffIds.push(staffRecord._id);
    }

    // Build query for teacher attendance
    const query = {
      branchId: branchObjectId,
      staffId: { $in: staffIds },
    };

    // Filter by specific teacher if provided
    if (teacherId) {
      let teacher;
      if (mongoose.Types.ObjectId.isValid(teacherId) && teacherId.length === 24) {
        teacher = teachers.find((t) => t._id.toString() === teacherId);
      } else {
        teacher = teachers.find(
          (t) => t.teacherId.toUpperCase() === teacherId.toUpperCase().trim()
        );
      }
      if (teacher) {
        // Find corresponding Staff record
        let staffRecord = staffRecords.find(s => s.email === teacher.email);
        if (!staffRecord) {
          staffRecord = await Staff.findOne({
            email: teacher.email,
            branchId: branchObjectId,
            role: 'TEACHER'
          });
          if (!staffRecord) {
            staffRecord = await Staff.create({
              branchId: teacher.branchId,
              staffId: teacher.teacherId,
              name: teacher.name,
              email: teacher.email,
              mobile: teacher.mobile,
              role: 'TEACHER',
              salaryType: teacher.salaryType,
              salaryRate: teacher.salaryRate,
              isActive: teacher.isActive,
            });
          }
        }
        query.staffId = staffRecord._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found',
        });
      }
    }

    // Handle date filtering
    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      const attendanceDateEnd = new Date(attendanceDate);
      attendanceDateEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: attendanceDate, $lte: attendanceDateEnd };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Parallel queries using aggregation for optimal performance
    const [attendance, total, statistics] = await Promise.all([
      // Get paginated attendance records
      StaffAttendance.find(query)
        .populate('staffId', 'staffId name role email mobile')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      // Total count
      StaffAttendance.countDocuments(query),

      // Statistics using aggregation
      StaffAttendance.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
            },
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRecords: 1,
            present: 1,
            absent: 1,
            late: 1,
            attendancePercentage: {
              $cond: [
                { $eq: ['$totalRecords', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$totalRecords'] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              ],
            },
          },
        },
      ]),
    ]);

    const stats = statistics[0] || {
      totalRecords: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendancePercentage: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        attendance: await Promise.all(attendance.map(async (att) => {
          // Find the teacher from Teacher model using staff email
          const staff = att.staffId;
          let teacher = null;
          if (staff) {
            teacher = await Teacher.findOne({ email: staff.email, branchId: branchObjectId });
            if (!teacher) {
              // Fallback to staff data if teacher not found
              teacher = {
                _id: staff._id,
                teacherId: staff.staffId,
                name: staff.name,
                email: staff.email,
                mobile: staff.mobile,
              };
            } else {
              teacher = {
                _id: teacher._id,
                teacherId: teacher.teacherId,
                name: teacher.name,
                email: teacher.email,
                mobile: teacher.mobile,
              };
            }
          }
          return {
            _id: att._id,
            date: att.date,
            status: att.status,
            timeSlot: att.timeSlot,
            checkIn: att.checkIn,
            checkOut: att.checkOut,
            method: att.method,
            teacher: teacher,
            markedBy: att.markedBy,
            createdAt: att.createdAt,
            updatedAt: att.updatedAt,
          };
        })),
        statistics: {
          totalRecords: stats.totalRecords,
          totalTeachers: teachers.length,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          attendancePercentage: stats.attendancePercentage,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teacher attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Student Attendance by ID
 * GET /api/admin/attendance/student/:id
 */
const getStudentAttendanceById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format',
      });
    }

    const attendance = await StudentAttendance.findOne({ _id: id, branchId })
      .populate('studentId', 'studentId name mobile')
      .populate('batchId', 'name timeSlot')
      .populate('markedBy', 'email role');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Student attendance not found',
      });
    }

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get student attendance by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Student Attendance
 * POST /api/admin/attendance/student/:id/update
 */
const updateStudentAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { status, timeSlot, method, inTime, outTime, date } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format',
      });
    }

    // Validate status if provided
    if (status && !['Present', 'Absent', 'Late'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: Present, Absent, or Late',
      });
    }

    // Validate method if provided
    if (method && !['QR', 'FACE', 'MANUAL'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid method. Must be: QR, FACE, or MANUAL',
      });
    }

    const attendance = await StudentAttendance.findOne({ _id: id, branchId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Student attendance not found',
      });
    }

    // Store old data for audit
    const oldData = {
      status: attendance.status,
      timeSlot: attendance.timeSlot,
      method: attendance.method,
      inTime: attendance.inTime,
      outTime: attendance.outTime,
      date: attendance.date,
    };

    // Update fields
    if (status) attendance.status = status;
    if (timeSlot) attendance.timeSlot = timeSlot;
    if (method) attendance.method = method;
    if (inTime) attendance.inTime = new Date(inTime);
    if (outTime) attendance.outTime = new Date(outTime);
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      attendance.date = newDate;
    }

    const updatedAttendance = await attendance.save();

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'STUDENT_ATTENDANCE',
      entityId: id,
      oldData,
      newData: {
        status: updatedAttendance.status,
        timeSlot: updatedAttendance.timeSlot,
        method: updatedAttendance.method,
        inTime: updatedAttendance.inTime,
        outTime: updatedAttendance.outTime,
        date: updatedAttendance.date,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student attendance updated successfully',
      data: await updatedAttendance.populate([
        { path: 'studentId', select: 'studentId name mobile' },
        { path: 'batchId', select: 'name timeSlot' }
      ]),
    });
  } catch (error) {
    console.error('Update student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating student attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Student Attendance
 * POST /api/admin/attendance/student/:id/delete
 */
const deleteStudentAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format',
      });
    }

    const attendance = await StudentAttendance.findOneAndDelete({ _id: id, branchId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Student attendance not found',
      });
    }

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'STUDENT_ATTENDANCE',
      entityId: id,
      oldData: {
        studentId: attendance.studentId,
        status: attendance.status,
        date: attendance.date,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student attendance deleted successfully',
    });
  } catch (error) {
    console.error('Delete student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting student attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Staff Attendance by ID
 * GET /api/admin/attendance/staff/:id
 */
const getStaffAttendanceById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format',
      });
    }

    // Try finding it with branchId first (normal operation)
    let attendance = await StaffAttendance.findOne({ _id: id, branchId })
      .populate('staffId', 'staffId name role mobile')
      .populate('markedBy', 'email role');

    if (!attendance) {
      // Diagnostic: Check if it exists at all (might be another branch)
      const existsInOtherBranch = await StaffAttendance.exists({ _id: id });

      if (existsInOtherBranch) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This attendance record belongs to another branch.',
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Staff attendance record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get staff attendance by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Staff Attendance
 * POST /api/admin/attendance/staff/:id/update
 */
const updateStaffAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { status, method, checkIn, checkOut, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format',
      });
    }

    const attendance = await StaffAttendance.findOne({ _id: id, branchId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Staff attendance not found',
      });
    }

    // Store old data for audit
    const oldData = {
      status: attendance.status,
      method: attendance.method,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
    };

    // Update fields
    if (status) attendance.status = status;
    if (method) attendance.method = method;
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      attendance.date = newDate;
    }

    const updatedAttendance = await attendance.save();

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'STAFF_ATTENDANCE',
      entityId: id,
      oldData,
      newData: {
        status: updatedAttendance.status,
        method: updatedAttendance.method,
        checkIn: updatedAttendance.checkIn,
        checkOut: updatedAttendance.checkOut,
        date: updatedAttendance.date,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Staff attendance updated successfully',
      data: await updatedAttendance.populate('staffId', 'staffId name role'),
    });
  } catch (error) {
    console.error('Update staff attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating staff attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Staff Attendance
 * POST /api/admin/attendance/staff/:id/delete
 */
const deleteStaffAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format',
      });
    }

    const attendance = await StaffAttendance.findOneAndDelete({ _id: id, branchId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Staff attendance not found',
      });
    }

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'STAFF_ATTENDANCE',
      entityId: id,
      oldData: {
        staffId: attendance.staffId,
        date: attendance.date,
        status: attendance.status,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Staff attendance deleted successfully',
    });
  } catch (error) {
    console.error('Delete staff attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting staff attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Student In-Time
 * POST /api/admin/attendance/student/in-time
 */
const markStudentInTime = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { studentId, date, timeSlot, method, qrData, inTime } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, date',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get batchId from student record
    const batchId = student.batchId;
    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: 'Student is not assigned to any batch',
      });
    }

    // Get batch for timeSlot
    const batch = await Batch.findOne({ _id: batchId, branchId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Student batch not found' });
    }

    // Check if student is active
    if (student.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Student is not active',
      });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.studentId !== student.studentId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Check for existing attendance on same date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    let attendance = await StudentAttendance.findOne({
      branchId,
      studentId: student._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (attendance) {
      // Update in-time if attendance exists
      attendance.inTime = inTime ? new Date(inTime) : new Date();
      attendance.timeSlot = timeSlot || batch.timeSlot;
      attendance.method = method || attendance.method || 'MANUAL';
      await attendance.save();
    } else {
      // Create new attendance record with in-time only
      attendance = await StudentAttendance.create({
        branchId,
        studentId: student._id,
        batchId,
        date: attendanceDate,
        timeSlot: timeSlot || batch.timeSlot,
        inTime: inTime ? new Date(inTime) : new Date(),
        outTime: null,
        status: 'Present',
        method: method || 'MANUAL',
        markedBy: req.user.id,
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'STUDENT_ATTENDANCE',
      entityId: attendance._id,
      newData: { studentId: student.studentId, inTime: attendance.inTime, method },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Student in-time marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Mark student in-time error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking in-time',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Student Out-Time
 * POST /api/admin/attendance/student/out-time
 */
const markStudentOutTime = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { studentId, date, outTime, method, qrData } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, date',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.studentId !== student.studentId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Find existing attendance for the date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const attendance = await StudentAttendance.findOne({
      branchId,
      studentId: student._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'In-time not marked for this date. Please mark in-time first.',
      });
    }

    // Update out-time
    attendance.outTime = outTime ? new Date(outTime) : new Date();
    if (method) attendance.method = method;
    await attendance.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'STUDENT_ATTENDANCE',
      entityId: attendance._id,
      oldData: { outTime: null },
      newData: { studentId: student.studentId, outTime: attendance.outTime },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student out-time marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Mark student out-time error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking out-time',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Staff Check-In
 * POST /api/admin/attendance/staff/check-in
 */
const markStaffCheckIn = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { staffId, date, timeSlot, method, qrData, checkIn } = req.body;

    if (!staffId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: staffId, date',
      });
    }

    // Verify staff belongs to branch
    const staff = await Staff.findOne({ staffId, branchId });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    // Check if staff is active
    if (!staff.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Staff is not active',
      });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.staffId !== staff.staffId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Check for existing attendance on same date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    let attendance = await StaffAttendance.findOne({
      branchId,
      staffId: staff._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (attendance) {
      // Update check-in if attendance exists
      attendance.checkIn = checkIn ? new Date(checkIn) : new Date();
      if (timeSlot) attendance.timeSlot = timeSlot;
      attendance.method = method || attendance.method || 'MANUAL';
      await attendance.save();
    } else {
      // Create new attendance record with check-in only
      attendance = await StaffAttendance.create({
        branchId,
        staffId: staff._id,
        date: attendanceDate,
        timeSlot: timeSlot || null,
        checkIn: checkIn ? new Date(checkIn) : new Date(),
        checkOut: null,
        status: 'Present',
        method: method || 'MANUAL',
        markedBy: req.user.id,
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'STAFF_ATTENDANCE',
      entityId: attendance._id,
      newData: { staffId: staff.staffId, checkIn: attendance.checkIn, method },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Staff check-in marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Mark staff check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking check-in',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Staff Check-Out
 * POST /api/admin/attendance/staff/check-out
 */
const markStaffCheckOut = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { staffId, date, checkOut, method, qrData } = req.body;

    if (!staffId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: staffId, date',
      });
    }

    // Verify staff belongs to branch
    const staff = await Staff.findOne({ staffId, branchId });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    // Verify QR code if method is QR
    if (method === 'QR' && qrData) {
      try {
        const qrInfo = JSON.parse(qrData);
        if (qrInfo.staffId !== staff.staffId || qrInfo.branchId !== branchId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code',
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format',
        });
      }
    }

    // Find existing attendance for the date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const attendanceDateEnd = new Date(attendanceDate);
    attendanceDateEnd.setHours(23, 59, 59, 999);

    const attendance = await StaffAttendance.findOne({
      branchId,
      staffId: staff._id,
      date: { $gte: attendanceDate, $lte: attendanceDateEnd },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'Check-in not marked for this date. Please mark check-in first.',
      });
    }

    // Update check-out
    attendance.checkOut = checkOut ? new Date(checkOut) : new Date();
    if (method) attendance.method = method;
    await attendance.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'STAFF_ATTENDANCE',
      entityId: attendance._id,
      oldData: { checkOut: null },
      newData: { staffId: staff.staffId, checkOut: attendance.checkOut },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Staff check-out marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Mark staff check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking check-out',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Teacher Attendance
 * POST /api/admin/attendance/teacher/:id/update
 * Update attendance record for teachers only (staff with role 'TEACHER')
 */
const updateTeacherAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { status, method, checkIn, checkOut, date, timeSlot } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format',
      });
    }

    // Find attendance record
    const attendance = await StaffAttendance.findOne({ _id: id, branchId })
      .populate('staffId', 'role email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Teacher attendance not found',
      });
    }

    // Verify it's for a teacher
    if (attendance.staffId.role !== 'TEACHER') {
      return res.status(400).json({
        success: false,
        message: 'This attendance record is not for a teacher',
      });
    }

    // Store old data for audit
    const oldData = {
      status: attendance.status,
      method: attendance.method,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      date: attendance.date,
      timeSlot: attendance.timeSlot,
    };

    // Update fields
    if (status) {
      if (!['Present', 'Absent', 'Late'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: Present, Absent, or Late',
        });
      }
      attendance.status = status;
    }
    if (method) {
      if (!['QR', 'MANUAL'].includes(method)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid method. Must be: QR or MANUAL',
        });
      }
      attendance.method = method;
    }
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    if (timeSlot) attendance.timeSlot = timeSlot;
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      attendance.date = newDate;
    }

    const updatedAttendance = await attendance.save();

    // Get teacher details for response
    const teacher = await Teacher.findOne({
      email: attendance.staffId.email,
      branchId,
    }).select('teacherId name email mobile');

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'TEACHER_ATTENDANCE',
      entityId: id,
      oldData,
      newData: {
        status: attendance.status,
        method: attendance.method,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        date: attendance.date,
        timeSlot: attendance.timeSlot,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Teacher attendance updated successfully',
      data: {
        _id: updatedAttendance._id,
        teacher: teacher
          ? {
              _id: teacher._id,
              teacherId: teacher.teacherId,
              name: teacher.name,
              email: teacher.email,
              mobile: teacher.mobile,
            }
          : null,
        date: updatedAttendance.date,
        timeSlot: updatedAttendance.timeSlot,
        checkIn: updatedAttendance.checkIn,
        checkOut: updatedAttendance.checkOut,
        status: updatedAttendance.status,
        method: updatedAttendance.method,
        markedBy: updatedAttendance.markedBy,
        createdAt: updatedAttendance.createdAt,
        updatedAt: updatedAttendance.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating teacher attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Teacher Attendance
 * POST /api/admin/attendance/teacher/:id/delete
 * Delete attendance record for teachers only (staff with role 'TEACHER')
 */
const deleteTeacherAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format',
      });
    }

    // Find attendance record
    const attendance = await StaffAttendance.findOne({ _id: id, branchId })
      .populate('staffId', 'role email');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Teacher attendance not found',
      });
    }

    // Verify it's for a teacher
    if (attendance.staffId.role !== 'TEACHER') {
      return res.status(400).json({
        success: false,
        message: 'This attendance record is not for a teacher',
      });
    }

    // Get teacher details for audit
    const teacher = await Teacher.findOne({
      email: attendance.staffId.email,
      branchId,
    }).select('teacherId name');

    // Log audit before deletion
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'TEACHER_ATTENDANCE',
      entityId: id,
      oldData: {
        teacherId: teacher?.teacherId,
        date: attendance.date,
        status: attendance.status,
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Delete attendance
    await StaffAttendance.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Teacher attendance deleted successfully',
    });
  } catch (error) {
    console.error('Delete teacher attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting teacher attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get All Absent People (Students, Teachers, Staff)
 * GET /api/admin/attendance/absent
 * Returns absent students, teachers, and staff for a given date
 */
const getAllAbsent = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { date, type } = req.query; // type: 'student', 'teacher', 'staff', or 'all'

    // Date range for query
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const queryDateEnd = new Date(queryDate);
    queryDateEnd.setHours(23, 59, 59, 999);

    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Determine which types to fetch
    const fetchStudents = !type || type === 'all' || type === 'student';
    const fetchTeachers = !type || type === 'all' || type === 'teacher';
    const fetchStaff = !type || type === 'all' || type === 'staff';

    // Parallel queries for all absent people
    const [
      absentStudents,
      absentTeachers,
      absentStaff,
    ] = await Promise.all([
      // Get absent students
      fetchStudents
        ? (async () => {
            // Get all active students
            const activeStudents = await Student.find({
              branchId,
              status: 'ACTIVE',
            })
              .populate('batchId', 'name timeSlot')
              .populate('courseId', 'name')
              .select('studentId studentName mobileNumber batchId courseId email')
              .lean();

            // Get present students for the date
            const presentStudentIds = await StudentAttendance.distinct('studentId', {
              branchId: branchObjectId,
              date: { $gte: queryDate, $lte: queryDateEnd },
              status: { $in: ['Present', 'Late'] },
            });

            // Find absent students (active but not present)
            const absent = activeStudents.filter(
              (student) => !presentStudentIds.some((id) => id.toString() === student._id.toString())
            );

            // Get marked absent records for additional info
            const markedAbsentRecords = await StudentAttendance.find({
              branchId: branchObjectId,
              date: { $gte: queryDate, $lte: queryDateEnd },
              status: 'Absent',
            })
              .populate('studentId', 'studentId studentName mobileNumber')
              .populate('batchId', 'name timeSlot')
              .lean();

            // Combine marked absent with unmarked absent
            const markedAbsentStudentIds = markedAbsentRecords.map((r) => r.studentId._id.toString());
            const unmarkedAbsent = absent.filter(
              (s) => !markedAbsentStudentIds.includes(s._id.toString())
            );

            return {
              marked: markedAbsentRecords.map((r) => ({
                _id: r._id,
                studentId: r.studentId.studentId,
                studentName: r.studentId.studentName,
                mobileNumber: r.studentId.mobileNumber,
                batch: r.batchId ? { name: r.batchId.name, timeSlot: r.batchId.timeSlot } : null,
                date: r.date,
                method: r.method,
                markedBy: r.markedBy,
              })),
              unmarked: unmarkedAbsent.map((s) => ({
                _id: s._id,
                studentId: s.studentId,
                studentName: s.studentName,
                mobileNumber: s.mobileNumber,
                batch: s.batchId ? { name: s.batchId.name, timeSlot: s.batchId.timeSlot } : null,
                course: s.courseId ? { name: s.courseId.name } : null,
                email: s.email,
              })),
            };
          })()
        : Promise.resolve({ marked: [], unmarked: [] }),

      // Get absent teachers
      fetchTeachers
        ? (async () => {
            // Get all active teachers
            const activeTeachers = await Teacher.find({
              branchId,
              isActive: true,
            })
              .select('teacherId name email mobile assignedBatches')
              .lean();

            // Get all Staff records for teachers (for attendance tracking)
            const teacherEmails = activeTeachers.map((t) => t.email);
            const staffRecords = await Staff.find({
              branchId,
              email: { $in: teacherEmails },
              role: 'TEACHER',
            }).select('_id email').lean();

            const staffIdMap = {};
            staffRecords.forEach((s) => {
              staffIdMap[s.email] = s._id;
            });

            // Get present teachers (staff with role TEACHER who are present)
            const presentStaffIds = await StaffAttendance.distinct('staffId', {
              branchId: branchObjectId,
              date: { $gte: queryDate, $lte: queryDateEnd },
              status: { $in: ['Present', 'Late'] },
            });

            // Find absent teachers
            const absent = activeTeachers.filter((teacher) => {
              const staffId = staffIdMap[teacher.email];
              return !staffId || !presentStaffIds.some((id) => id.toString() === staffId.toString());
            });

            // Get marked absent records for teachers
            const markedAbsentRecords = await StaffAttendance.find({
              branchId: branchObjectId,
              date: { $gte: queryDate, $lte: queryDateEnd },
              status: 'Absent',
              staffId: { $in: Object.values(staffIdMap) },
            })
              .populate('staffId', 'staffId name email role')
              .lean();

            // Map marked absent to teachers
            const markedAbsentEmails = markedAbsentRecords.map((r) => r.staffId.email);
            const unmarkedAbsent = absent.filter((t) => !markedAbsentEmails.includes(t.email));

            return {
              marked: markedAbsentRecords.map((r) => ({
                _id: r._id,
                teacherId: activeTeachers.find((t) => t.email === r.staffId.email)?.teacherId || null,
                name: r.staffId.name,
                email: r.staffId.email,
                mobile: activeTeachers.find((t) => t.email === r.staffId.email)?.mobile || null,
                date: r.date,
                timeSlot: r.timeSlot,
                method: r.method,
                markedBy: r.markedBy,
              })),
              unmarked: unmarkedAbsent.map((t) => ({
                _id: t._id,
                teacherId: t.teacherId,
                name: t.name,
                email: t.email,
                mobile: t.mobile,
                assignedBatches: t.assignedBatches || [],
              })),
            };
          })()
        : Promise.resolve({ marked: [], unmarked: [] }),

      // Get absent staff (non-teacher staff)
      fetchStaff
        ? (async () => {
            // Get all active staff (excluding teachers)
            const activeStaff = await Staff.find({
              branchId,
              role: { $ne: 'TEACHER' },
              isActive: true,
            })
              .select('staffId name email mobile role')
              .lean();

            // Get present staff
            const presentStaffIds = await StaffAttendance.distinct('staffId', {
              branchId: branchObjectId,
              date: { $gte: queryDate, $lte: queryDateEnd },
              status: { $in: ['Present', 'Late'] },
            });

            // Find absent staff
            const absent = activeStaff.filter(
              (staff) => !presentStaffIds.some((id) => id.toString() === staff._id.toString())
            );

            // Get marked absent records
            const markedAbsentRecords = await StaffAttendance.find({
              branchId: branchObjectId,
              date: { $gte: queryDate, $lte: queryDateEnd },
              status: 'Absent',
              staffId: { $in: activeStaff.map((s) => s._id) },
            })
              .populate('staffId', 'staffId name email role')
              .lean();

            const markedAbsentStaffIds = markedAbsentRecords.map((r) => r.staffId._id.toString());
            const unmarkedAbsent = absent.filter(
              (s) => !markedAbsentStaffIds.includes(s._id.toString())
            );

            return {
              marked: markedAbsentRecords.map((r) => ({
                _id: r._id,
                staffId: r.staffId.staffId,
                name: r.staffId.name,
                email: r.staffId.email,
                mobile: r.staffId.mobile,
                role: r.staffId.role,
                date: r.date,
                timeSlot: r.timeSlot,
                method: r.method,
                markedBy: r.markedBy,
              })),
              unmarked: unmarkedAbsent.map((s) => ({
                _id: s._id,
                staffId: s.staffId,
                name: s.name,
                email: s.email,
                mobile: s.mobile,
                role: s.role,
              })),
            };
          })()
        : Promise.resolve({ marked: [], unmarked: [] }),
    ]);

    // Calculate totals
    const totalAbsent = {
      students: absentStudents.marked.length + absentStudents.unmarked.length,
      teachers: absentTeachers.marked.length + absentTeachers.unmarked.length,
      staff: absentStaff.marked.length + absentStaff.unmarked.length,
      total: 0,
    };
    totalAbsent.total = totalAbsent.students + totalAbsent.teachers + totalAbsent.staff;

    res.status(200).json({
      success: true,
      data: {
        date: queryDate.toISOString().split('T')[0],
        summary: {
          totalAbsent: totalAbsent.total,
          students: {
            total: totalAbsent.students,
            marked: absentStudents.marked.length,
            unmarked: absentStudents.unmarked.length,
          },
          teachers: {
            total: totalAbsent.teachers,
            marked: absentTeachers.marked.length,
            unmarked: absentTeachers.unmarked.length,
          },
          staff: {
            total: totalAbsent.staff,
            marked: absentStaff.marked.length,
            unmarked: absentStaff.unmarked.length,
          },
        },
        absent: {
          students: {
            marked: absentStudents.marked,
            unmarked: absentStudents.unmarked,
          },
          teachers: {
            marked: absentTeachers.marked,
            unmarked: absentTeachers.unmarked,
          },
          staff: {
            marked: absentStaff.marked,
            unmarked: absentStaff.unmarked,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get all absent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching absent records',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  markStudentAttendance,
  markStudentInTime,
  markStudentOutTime,
  markStaffAttendance,
  markStaffCheckIn,
  markStaffCheckOut,
  markTeacherAttendance,
  markTeacherCheckIn,
  markTeacherCheckOut,
  getStudentAttendance,
  getStaffAttendance,
  getTeacherAttendance,
  getAllAbsent,
  getStudentAttendanceById,
  updateStudentAttendance,
  deleteStudentAttendance,
  getStaffAttendanceById,
  updateStaffAttendance,
  deleteStaffAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
};

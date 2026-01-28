const { StudentAttendance, StaffAttendance } = require('../models/attendance.model');
const Student = require('../models/student.model');
const Staff = require('../models/staff.model');
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
    const { studentId, batchId, date, timeSlot, method, qrData } = req.body;

    if (!studentId || !batchId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, batchId, date',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Verify batch belongs to branch
    const batch = await Batch.findOne({ _id: batchId, branchId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Verify student is in this batch
    if (student.batchId.toString() !== batchId) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this batch',
      });
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
    const { staffId, date, timeSlot, method, qrData } = req.body;

    if (!staffId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: staffId, date',
      });
    }

    // Verify staff belongs to branch
    const staff = await Staff.findOne({ _id: staffId, branchId });
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
      staffId,
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
      staffId,
      date: attendanceDate,
      timeSlot: timeSlot || '',
      checkIn: new Date(),
      status: 'Present',
      method: method || 'MANUAL',
      markedBy: req.user.id,
    });

    // Update staff class count if teacher
    if (staff.role === 'TEACHER' && staff.salaryType === 'PER_CLASS') {
      await Staff.findByIdAndUpdate(staffId, {
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
      newData: { staffId, status: 'Present', method },
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
    const { studentId, batchId, startDate, endDate } = req.query;

    const query = { branchId };
    if (studentId) query.studentId = studentId;
    if (batchId) query.batchId = batchId;

    if (startDate || endDate) {
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
    const { staffId, startDate, endDate } = req.query;

    const query = { branchId };
    if (staffId) query.staffId = staffId;

    if (startDate || endDate) {
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
    const { status, timeSlot, method } = req.body;

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
    };

    // Update fields
    if (status) attendance.status = status;
    if (timeSlot) attendance.timeSlot = timeSlot;
    if (method) attendance.method = method;

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
      },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student attendance updated successfully',
      data: await updatedAttendance.populate('studentId', 'studentId name mobile').populate('batchId', 'name timeSlot'),
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

module.exports = {
  markStudentAttendance,
  markStaffAttendance,
  getStudentAttendance,
  getStaffAttendance,
  getStudentAttendanceById,
  updateStudentAttendance,
  deleteStudentAttendance,
};

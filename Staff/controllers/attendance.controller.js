const { StaffAttendance, StudentAttendance } = require('../../Admin/models/attendance.model');
const Staff = require('../../Admin/models/staff.model');
const Student = require('../../Admin/models/student.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Staff Self Attendance (QR Scan Based)
 * POST /api/staff/attendance/self
 * Flow: First scan → Check-in, Second scan → Check-out
 */
const markSelfAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required',
      });
    }

    // Parse QR data (should contain staffId)
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch {
      parsedData = { staffId: qrData };
    }

    // Verify QR belongs to this staff
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    if (parsedData.staffId !== staff.staffId && parsedData.staffId !== staffId) {
      return res.status(403).json({
        success: false,
        message: 'QR code does not match your staff ID',
      });
    }

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check existing attendance for today
    let attendance = await StaffAttendance.findOne({
      branchId,
      staffId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const now = new Date();

    if (!attendance) {
      // First scan - Check-in
      attendance = await StaffAttendance.create({
        branchId,
        staffId,
        date: now,
        checkIn: now,
        status: 'Present',
        method: 'QR',
      });

      await logAudit({
        branchId,
        userId: staffId,
        role: 'STAFF',
        action: 'CHECK_IN',
        module: 'ATTENDANCE',
        entityId: attendance._id.toString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(201).json({
        success: true,
        message: 'Check-in successful',
        data: {
          attendanceId: attendance._id,
          checkIn: attendance.checkIn,
          status: 'Checked In',
        },
      });
    } else {
      // Second scan - Check-out (if not already checked out)
      if (attendance.checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Already checked out for today',
        });
      }

      attendance.checkOut = now;
      attendance.status = 'Present';
      await attendance.save();

      await logAudit({
        branchId,
        userId: staffId,
        role: 'STAFF',
        action: 'CHECK_OUT',
        module: 'ATTENDANCE',
        entityId: attendance._id.toString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        message: 'Check-out successful',
        data: {
          attendanceId: attendance._id,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          status: 'Checked Out',
        },
      });
    }
  } catch (error) {
    console.error('Staff self attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Mark Student Attendance (Support Role)
 * POST /api/staff/attendance/student
 */
const markStudentAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { studentId, batchId, timeSlot, method = 'MANUAL', qrData } = req.body;

    if (!studentId || !batchId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, batchId',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({
      _id: studentId,
      branchId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or does not belong to your branch',
      });
    }

    // If QR method, verify QR data
    if (method === 'QR' && qrData) {
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch {
        parsedData = { studentId: qrData };
      }

      if (parsedData.studentId !== student.studentId) {
        return res.status(403).json({
          success: false,
          message: 'QR code does not match student ID',
        });
      }
    }

    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for duplicate attendance (same student, same batch, same date, same timeSlot)
    const existingAttendance = await StudentAttendance.findOne({
      branchId,
      studentId,
      batchId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      timeSlot: timeSlot || { $exists: false },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student today',
        data: existingAttendance,
      });
    }

    // Create attendance record
    const attendance = await StudentAttendance.create({
      branchId,
      studentId,
      batchId,
      date: new Date(),
      timeSlot: timeSlot || student.batchTime,
      status: 'Present',
      method: method.toUpperCase(),
      markedBy: staffId,
    });

    await logAudit({
      branchId,
      userId: staffId,
      role: 'STAFF',
      action: 'MARK_STUDENT_ATTENDANCE',
      module: 'ATTENDANCE',
      entityId: attendance._id.toString(),
      newData: { studentId, batchId, status: 'Present' },
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
      message: 'Server error while marking student attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  markSelfAttendance,
  markStudentAttendance,
};

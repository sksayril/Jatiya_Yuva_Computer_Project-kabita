const mongoose = require('mongoose');
const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Student = require('../../Admin/models/student.model');
const Batch = require('../../Admin/models/batch.model');
const { logAudit } = require('../utils/auditLogger');
const { verifyBatchAssignment } = require('../middlewares/batchIsolation.middleware');
const config = require('../config/env.config');

/**
 * Mark Student Attendance (Class Time)
 * POST /api/teacher/attendance/student
 * Teachers can only mark attendance for students in their assigned batches
 */
const markStudentAttendance = async (req, res) => {
  try {
    const branchId = req.branchId;
    const teacherId = req.teacherId;
    const assignedBatches = req.assignedBatches;
    const { studentId, batchId, timeSlot, method = 'MANUAL', qrData } = req.body;

    if (!studentId || !batchId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, batchId',
      });
    }

    // Verify batch is assigned to teacher
    try {
      verifyBatchAssignment(batchId, assignedBatches);
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    // Verify student belongs to branch and batch
    // Handle both ObjectId and student ID string (e.g., "DHK006-2026-001")
    let student;
    if (mongoose.Types.ObjectId.isValid(studentId) && studentId.length === 24) {
      // studentId is an ObjectId
      student = await Student.findOne({
        _id: studentId,
        branchId,
        batchId,
      });
    } else {
      // studentId is a student ID string (e.g., "DHK006-2026-001")
      student = await Student.findOne({
        studentId: studentId.toUpperCase().trim(),
        branchId,
        batchId,
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or does not belong to this batch',
      });
    }

    if (student.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Student is not active',
      });
    }

    // Verify batch belongs to branch
    const batch = await Batch.findOne({ _id: batchId, branchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
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

    // Face recognition placeholder
    if (method === 'FACE') {
      // Placeholder - integrate face recognition service
      return res.status(501).json({
        success: false,
        message: 'Face recognition is not yet implemented',
      });
    }

    // Check for duplicate attendance (same student, same batch, same date, same timeSlot)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Use student's ObjectId for attendance query
    const studentObjectId = student._id;
    const existingAttendance = await StudentAttendance.findOne({
      branchId,
      studentId: studentObjectId,
      batchId,
      date: { $gte: today, $lte: todayEnd },
      timeSlot: timeSlot || batch.timeSlot,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student today',
        data: existingAttendance,
      });
    }

    // Determine status (Present, Late, or Absent based on time)
    let status = 'Present';
    const currentTime = new Date();
    const batchTime = batch.timeSlot || timeSlot;
    
    // Simple late detection (can be enhanced)
    if (batchTime === 'AM' && currentTime.getHours() > 10) {
      status = 'Late';
    } else if (batchTime === 'PM' && currentTime.getHours() > 14) {
      status = 'Late';
    } else if (batchTime === 'EVENING' && currentTime.getHours() > 18) {
      status = 'Late';
    }

    // Create attendance record
    // Use student's ObjectId for attendance record
    const attendance = await StudentAttendance.create({
      branchId,
      studentId: studentObjectId,
      batchId,
      date: currentTime,
      timeSlot: timeSlot || batch.timeSlot,
      status,
      method: method.toUpperCase(),
      markedBy: teacherId,
    });

    await logAudit({
      branchId,
      userId: teacherId,
      role: 'TEACHER',
      action: 'MARK_ATTENDANCE',
      module: 'ATTENDANCE',
      entityId: attendance._id.toString(),
      newData: { studentId, batchId, status, method },
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

module.exports = {
  markStudentAttendance,
};

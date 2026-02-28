const mongoose = require('mongoose');
const { StudentAttendance, StaffAttendance } = require('../../Admin/models/attendance.model');
const Student = require('../../Admin/models/student.model');
const Staff = require('../../Admin/models/staff.model');
const Teacher = require('../../Admin/models/teacher.model');
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

/**
 * Get My Attendance Details
 * GET /api/teacher/attendance/my
 * Get comprehensive teacher attendance data with statistics
 */
const getMyAttendance = async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const branchId = req.branchId;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    const branchObjectId = new mongoose.Types.ObjectId(branchId);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get teacher details
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Find or create Staff record for attendance tracking
    let staffRecord = await Staff.findOne({
      email: teacher.email,
      branchId,
      role: 'TEACHER',
    });

    if (!staffRecord) {
      return res.status(200).json({
        success: true,
        data: {
          attendance: [],
          statistics: {
            overall: {
              totalDays: 0,
              present: 0,
              absent: 0,
              late: 0,
              totalHours: 0,
              percentage: 0,
            },
            thisWeek: {
              totalDays: 0,
              present: 0,
              absent: 0,
              totalHours: 0,
              percentage: 0,
            },
            thisMonth: {
              totalDays: 0,
              present: 0,
              absent: 0,
              totalHours: 0,
              percentage: 0,
            },
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

    const staffObjectId = new mongoose.Types.ObjectId(staffRecord._id);

    // Build query
    const query = {
      branchId: branchObjectId,
      staffId: staffObjectId,
    };

    // Date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Today's date range
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // This week's date range
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // This month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Parallel queries using aggregation
    const [attendances, total, overallStats, weekStats, monthStats] = await Promise.all([
      // Get paginated attendance records
      StaffAttendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      // Total count
      StaffAttendance.countDocuments(query),

      // Overall statistics
      StaffAttendance.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
            },
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
            },
            totalHours: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ['$checkIn', null] }, { $ne: ['$checkOut', null] }] },
                  {
                    $divide: [
                      { $subtract: ['$checkOut', '$checkIn'] },
                      3600000, // Convert milliseconds to hours
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),

      // This week statistics
      StaffAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            staffId: staffObjectId,
            date: { $gte: weekStart, $lte: weekEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
            },
            totalHours: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ['$checkIn', null] }, { $ne: ['$checkOut', null] }] },
                  {
                    $divide: [
                      { $subtract: ['$checkOut', '$checkIn'] },
                      3600000,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),

      // This month statistics
      StaffAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            staffId: staffObjectId,
            date: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
            },
            totalHours: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ['$checkIn', null] }, { $ne: ['$checkOut', null] }] },
                  {
                    $divide: [
                      { $subtract: ['$checkOut', '$checkIn'] },
                      3600000,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const overall = overallStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      totalHours: 0,
    };

    const week = weekStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      totalHours: 0,
    };

    const month = monthStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      totalHours: 0,
    };

    // Calculate percentages
    const overallPercentage =
      overall.totalDays > 0 ? Math.round((overall.present / overall.totalDays) * 100) : 0;
    const weekPercentage = week.totalDays > 0 ? Math.round((week.present / week.totalDays) * 100) : 0;
    const monthPercentage = month.totalDays > 0 ? Math.round((month.present / month.totalDays) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        attendance: attendances.map((att) => ({
          _id: att._id,
          date: att.date,
          status: att.status,
          timeSlot: att.timeSlot,
          checkIn: att.checkIn,
          checkOut: att.checkOut,
          method: att.method,
          hours:
            att.checkIn && att.checkOut
              ? Math.round(((new Date(att.checkOut) - new Date(att.checkIn)) / (1000 * 60 * 60)) * 100) / 100
              : 0,
          createdAt: att.createdAt,
          updatedAt: att.updatedAt,
        })),
        statistics: {
          overall: {
            totalDays: overall.totalDays,
            present: overall.present,
            absent: overall.absent,
            late: overall.late,
            totalHours: Math.round(overall.totalHours * 100) / 100,
            percentage: overallPercentage,
          },
          thisWeek: {
            totalDays: week.totalDays,
            present: week.present,
            absent: week.absent,
            totalHours: Math.round(week.totalHours * 100) / 100,
            percentage: weekPercentage,
          },
          thisMonth: {
            totalDays: month.totalDays,
            present: month.present,
            absent: month.absent,
            totalHours: Math.round(month.totalHours * 100) / 100,
            percentage: monthPercentage,
          },
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get My Absence and Late History
 * GET /api/teacher/attendance/absence-history
 * Returns absent and late attendance records for the authenticated teacher
 */
const getMyAbsenceHistory = async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const branchId = req.branchId;
    const { page = 1, limit = 30, status } = req.query; // status: 'Absent', 'Late', or both

    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Get teacher details
    const teacher = await Teacher.findById(teacherId).select('email').lean();
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Find Staff record for attendance tracking
    const staffRecord = await Staff.findOne({
      email: teacher.email,
      branchId,
      role: 'TEACHER',
    });

    if (!staffRecord) {
      // If no Staff record exists, return empty results
      return res.status(200).json({
        success: true,
        data: {
          absences: [],
          lates: [],
          summary: {
            totalAbsentDays: 0,
            totalLateDays: 0,
            totalDays: 0,
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
          note: 'No attendance records found. Contact admin if you believe this is an error.',
        },
      });
    }

    // Build query for absent and late records
    const statusFilter = status ? [status] : ['Absent', 'Late'];
    const query = {
      branchId: branchObjectId,
      staffId: staffRecord._id,
      status: { $in: statusFilter },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get attendance records
    const [attendanceRecords, total] = await Promise.all([
      StaffAttendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StaffAttendance.countDocuments(query),
    ]);

    // Separate absent and late records
    const absences = attendanceRecords.filter((r) => r.status === 'Absent');
    const lates = attendanceRecords.filter((r) => r.status === 'Late');

    // Get statistics using aggregation
    const [absentStats, lateStats] = await Promise.all([
      StaffAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            staffId: staffRecord._id,
            status: 'Absent',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
      ]),
      StaffAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            staffId: staffRecord._id,
            status: 'Late',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalAbsentDays = absentStats[0]?.total || 0;
    const totalLateDays = lateStats[0]?.total || 0;

    // Format response
    const formattedAbsences = absences.map((record) => ({
      _id: record._id,
      date: record.date,
      timeSlot: record.timeSlot,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      method: record.method,
      hours:
        record.checkIn && record.checkOut
          ? Math.round(((new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60 * 60)) * 100) / 100
          : 0,
      markedBy: record.markedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    const formattedLates = lates.map((record) => ({
      _id: record._id,
      date: record.date,
      timeSlot: record.timeSlot,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      method: record.method,
      hours:
        record.checkIn && record.checkOut
          ? Math.round(((new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60 * 60)) * 100) / 100
          : 0,
      markedBy: record.markedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        absences: formattedAbsences,
        lates: formattedLates,
        summary: {
          totalAbsentDays,
          totalLateDays,
          totalDays: totalAbsentDays + totalLateDays,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        note: 'Absence and late history is read-only. Contact admin for any queries.',
      },
    });
  } catch (error) {
    console.error('Get absence history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching absence history',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  markStudentAttendance,
  getMyAttendance,
  getMyAbsenceHistory,
};

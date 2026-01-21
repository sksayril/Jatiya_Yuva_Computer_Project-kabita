const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Student = require('../../Admin/models/student.model');
const config = require('../config/env.config');

/**
 * Get Student Attendance (View Only)
 * GET /api/student/attendance
 */
const getAttendance = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    // Build query
    const query = { branchId, studentId };

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get attendance records
    const [attendances, total] = await Promise.all([
      StudentAttendance.find(query)
        .populate('batchId', 'name timeSlot')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StudentAttendance.countDocuments(query),
    ]);

    // Calculate statistics
    const presentCount = await StudentAttendance.countDocuments({
      ...query,
      status: 'Present',
    });
    const absentCount = await StudentAttendance.countDocuments({
      ...query,
      status: 'Absent',
    });
    const lateCount = await StudentAttendance.countDocuments({
      ...query,
      status: 'Late',
    });

    const attendancePercentage =
      total === 0 ? 0 : Math.round((presentCount / total) * 100);

    // Check exam eligibility (typically requires 75%+ attendance)
    const examEligibilityThreshold = 75;
    const isExamEligible = attendancePercentage >= examEligibilityThreshold;

    res.status(200).json({
      success: true,
      data: {
        attendances,
        statistics: {
          total,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          attendancePercentage,
          examEligible: isExamEligible,
          examEligibilityThreshold,
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
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getAttendance,
};

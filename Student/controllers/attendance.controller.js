const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Student = require('../../Admin/models/student.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Student Attendance (View Only)
 * GET /api/student/attendance
 * Uses aggregation for optimal performance
 */
const getAttendance = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Build query
    const query = {
      branchId: branchObjectId,
      studentId: studentObjectId,
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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Parallel queries using aggregation for statistics
    const [attendances, total, statistics] = await Promise.all([
      // Get attendance records
      StudentAttendance.find(query)
        .populate('batchId', 'name timeSlot')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      // Total count
      StudentAttendance.countDocuments(query),

      // Statistics using aggregation
      StudentAttendance.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
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
            total: 1,
            present: 1,
            absent: 1,
            late: 1,
            attendancePercentage: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$total'] },
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
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendancePercentage: 0,
    };

    // Check exam eligibility (typically requires 75%+ attendance)
    const examEligibilityThreshold = 75;
    const isExamEligible = stats.attendancePercentage >= examEligibilityThreshold;

    res.status(200).json({
      success: true,
      data: {
        attendances: attendances.map((att) => ({
          _id: att._id,
          date: att.date,
          status: att.status,
          timeSlot: att.timeSlot,
          method: att.method,
          batchId: att.batchId
            ? {
                _id: att.batchId._id,
                name: att.batchId.name,
                timeSlot: att.batchId.timeSlot,
              }
            : null,
        })),
        statistics: {
          total: stats.total,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          attendancePercentage: stats.attendancePercentage,
          examEligible: isExamEligible,
          examEligibilityThreshold: examEligibilityThreshold,
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
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get My Attendance Details
 * GET /api/student/attendance/details
 * Comprehensive attendance details with statistics, trends, and breakdowns
 */
const getMyAttendanceDetails = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const currentYear = new Date(today.getFullYear(), 0, 1);

    // Parallel aggregation queries for comprehensive attendance details
    const [
      overallStats,
      monthlyStats,
      lastMonthStats,
      yearlyStats,
      recentAttendance,
      monthlyBreakdown,
      statusBreakdown,
      examEligibility,
    ] = await Promise.all([
      // Overall attendance statistics
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
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
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
            },
            firstAttendance: { $min: '$date' },
            lastAttendance: { $max: '$date' },
          },
        },
        {
          $project: {
            _id: 0,
            totalDays: 1,
            present: 1,
            absent: 1,
            late: 1,
            firstAttendance: 1,
            lastAttendance: 1,
            percentage: {
              $cond: [
                { $eq: ['$totalDays', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$totalDays'] },
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

      // Current month statistics
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
            date: { $gte: currentMonth, $lt: nextMonth },
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
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalDays: 1,
            present: 1,
            absent: 1,
            late: 1,
            percentage: {
              $cond: [
                { $eq: ['$totalDays', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$totalDays'] },
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

      // Last month statistics for comparison
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
            date: { $gte: lastMonthStart, $lt: currentMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalDays: 1,
            present: 1,
            percentage: {
              $cond: [
                { $eq: ['$totalDays', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$totalDays'] },
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

      // Yearly statistics
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
            date: { $gte: currentYear },
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
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalDays: 1,
            present: 1,
            absent: 1,
            late: 1,
            percentage: {
              $cond: [
                { $eq: ['$totalDays', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$totalDays'] },
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

      // Recent attendance (last 20)
      StudentAttendance.find({
        branchId: branchObjectId,
        studentId: studentObjectId,
      })
        .sort({ date: -1 })
        .limit(20)
        .populate('batchId', 'name timeSlot')
        .select('date status timeSlot inTime outTime method batchId')
        .lean(),

      // Monthly breakdown (last 6 months)
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
            date: {
              $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
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
          },
        },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            totalDays: 1,
            present: 1,
            absent: 1,
            late: 1,
            percentage: {
              $cond: [
                { $eq: ['$totalDays', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$totalDays'] },
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
        {
          $sort: { year: -1, month: -1 },
        },
      ]),

      // Status breakdown by time slot
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
          },
        },
        {
          $group: {
            _id: '$timeSlot',
            total: { $sum: 1 },
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
            timeSlot: '$_id',
            total: 1,
            present: 1,
            absent: 1,
            late: 1,
            percentage: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$total'] },
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

      // Exam eligibility check
      StudentAttendance.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalDays: 1,
            present: 1,
            percentage: {
              $cond: [
                { $eq: ['$totalDays', 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ['$present', '$totalDays'] },
                        100,
                      ],
                    },
                    2,
                  ],
                },
              ],
            },
            eligible: {
              $gte: [
                {
                  $multiply: [
                    { $divide: ['$present', '$totalDays'] },
                    100,
                  ],
                },
                75,
              ],
            },
          },
        },
      ]),
    ]);

    // Process results
    const overall = overallStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
      firstAttendance: null,
      lastAttendance: null,
    };

    const monthly = monthlyStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
    };

    const lastMonth = lastMonthStats[0] || {
      totalDays: 0,
      present: 0,
      percentage: 0,
    };

    const yearly = yearlyStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      percentage: 0,
    };

    const eligibility = examEligibility[0] || {
      totalDays: 0,
      present: 0,
      percentage: 0,
      eligible: false,
    };

    // Calculate trend (current month vs last month)
    const trend =
      lastMonth.totalDays > 0
        ? monthly.percentage - lastMonth.percentage
        : 0;

    // Calculate attendance status
    let status = 'Poor';
    if (overall.percentage >= 90) status = 'Excellent';
    else if (overall.percentage >= 80) status = 'Good';
    else if (overall.percentage >= 70) status = 'Average';
    else if (overall.percentage >= 50) status = 'Needs Improvement';

    res.status(200).json({
      success: true,
      data: {
        overall: {
          totalDays: overall.totalDays,
          present: overall.present,
          absent: overall.absent,
          late: overall.late,
          percentage: overall.percentage,
          status: status,
          firstAttendance: overall.firstAttendance,
          lastAttendance: overall.lastAttendance,
        },
        monthly: {
          currentMonth: today.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          }),
          totalDays: monthly.totalDays,
          present: monthly.present,
          absent: monthly.absent,
          late: monthly.late,
          percentage: monthly.percentage,
          trend: trend,
          trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        },
        yearly: {
          year: today.getFullYear(),
          totalDays: yearly.totalDays,
          present: yearly.present,
          absent: yearly.absent,
          late: yearly.late,
          percentage: yearly.percentage,
        },
        examEligibility: {
          eligible: eligibility.eligible,
          threshold: 75,
          currentPercentage: eligibility.percentage,
          message: eligibility.eligible
            ? 'You are eligible for exams'
            : `You need ${75 - eligibility.percentage}% more attendance to be eligible for exams`,
        },
        monthlyBreakdown: monthlyBreakdown.map((m) => ({
          month: new Date(m.year, m.month - 1).toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          }),
          totalDays: m.totalDays,
          present: m.present,
          absent: m.absent,
          late: m.late,
          percentage: m.percentage,
        })),
        statusBreakdown: statusBreakdown.map((s) => ({
          timeSlot: s.timeSlot || 'N/A',
          total: s.total,
          present: s.present,
          absent: s.absent,
          late: s.late,
          percentage: s.percentage,
        })),
        recentAttendance: recentAttendance.map((att) => ({
          _id: att._id,
          date: att.date,
          status: att.status,
          timeSlot: att.timeSlot,
          inTime: att.inTime,
          outTime: att.outTime,
          method: att.method,
          batch: att.batchId
            ? {
                _id: att.batchId._id,
                name: att.batchId.name,
                timeSlot: att.batchId.timeSlot,
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error('Get attendance details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance details',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getAttendance,
  getMyAttendanceDetails,
};

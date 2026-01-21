const { StudentAttendance } = require('../../Admin/models/attendance.model');
const FollowUp = require('../models/followUp.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Attendance Report (Staff's own data)
 * GET /api/staff/reports/attendance
 */
const getAttendanceReport = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { startDate, endDate, studentId, page = 1, limit = 50 } = req.query;

    const query = { branchId };
    if (studentId) query.studentId = studentId;

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

    const [attendances, total] = await Promise.all([
      StudentAttendance.find(query)
        .populate('studentId', 'studentId studentName mobileNumber')
        .populate('batchId', 'name timeSlot')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StudentAttendance.countDocuments(query),
    ]);

    // Summary statistics
    const presentCount = attendances.filter((a) => a.status === 'Present').length;
    const absentCount = attendances.filter((a) => a.status === 'Absent').length;
    const lateCount = attendances.filter((a) => a.status === 'Late').length;

    res.status(200).json({
      success: true,
      data: {
        attendances,
        summary: {
          total,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
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
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance report',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Follow-up Report (Staff's own data)
 * GET /api/staff/reports/follow-ups
 */
const getFollowUpReport = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { startDate, endDate, status, reason, page = 1, limit = 50 } = req.query;

    const query = { branchId, staffId };
    if (status) query.followUpStatus = status;
    if (reason) query.reason = reason;

    // Date range
    if (startDate || endDate) {
      query.absentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.absentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.absentDate.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [followUps, total] = await Promise.all([
      FollowUp.find(query)
        .populate('studentId', 'studentId studentName mobileNumber')
        .sort({ absentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FollowUp.countDocuments(query),
    ]);

    // Summary statistics
    const pendingCount = followUps.filter((f) => f.followUpStatus === 'Pending').length;
    const resolvedCount = followUps.filter((f) => f.followUpStatus === 'Resolved').length;
    const droppedCount = followUps.filter((f) => f.followUpStatus === 'Dropped').length;

    // Reason breakdown
    const reasonBreakdown = {};
    followUps.forEach((f) => {
      reasonBreakdown[f.reason] = (reasonBreakdown[f.reason] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        followUps,
        summary: {
          total,
          pending: pendingCount,
          resolved: resolvedCount,
          dropped: droppedCount,
          reasonBreakdown,
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
    console.error('Get follow-up report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching follow-up report',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getAttendanceReport,
  getFollowUpReport,
};

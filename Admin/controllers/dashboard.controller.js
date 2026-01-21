const Student = require('../models/student.model');
const Staff = require('../models/staff.model');
const { StudentAttendance, StaffAttendance } = require('../models/attendance.model');
const Payment = require('../models/payment.model');
const config = require('../config/env.config');

/**
 * Get Dashboard Summary
 * GET /api/admin/dashboard/summary
 */
const getDashboardSummary = async (req, res) => {
  try {
    const branchId = req.branchId;

    // Total counts
    const [totalStudents, totalStaff] = await Promise.all([
      Student.countDocuments({ branchId, status: 'ACTIVE' }),
      Staff.countDocuments({ branchId, isActive: true }),
    ]);

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's attendance
    const [todayStudentAttendance, todayStaffAttendance] = await Promise.all([
      StudentAttendance.find({
        branchId,
        date: { $gte: todayStart, $lte: todayEnd },
      }),
      StaffAttendance.find({
        branchId,
        date: { $gte: todayStart, $lte: todayEnd },
      }),
    ]);

    const todayStudentPresent = todayStudentAttendance.filter(
      (a) => a.status === 'Present'
    ).length;
    const todayStudentTotal = todayStudentAttendance.length;
    const todayStudentAttendancePercentage =
      todayStudentTotal === 0
        ? 0
        : Math.round((todayStudentPresent / todayStudentTotal) * 100);

    const todayStaffPresent = todayStaffAttendance.filter(
      (a) => a.status === 'Present'
    ).length;
    const todayStaffTotal = todayStaffAttendance.length;
    const todayStaffAttendancePercentage =
      todayStaffTotal === 0
        ? 0
        : Math.round((todayStaffPresent / todayStaffTotal) * 100);

    // Current month fee collection
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const mongoose = require('mongoose');
    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ['$amount', '$discount'] } },
        },
      },
    ]);

    const currentMonthFeeCollection = monthlyPayments[0]?.total || 0;

    // Total due fees
    const dueAmounts = await Student.aggregate([
      {
        $match: { branchId: new mongoose.Types.ObjectId(branchId) },
      },
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$dueAmount' },
        },
      },
    ]);

    const totalDueFees = dueAmounts[0]?.totalDue || 0;

    // Alerts
    const alerts = [];

    // High due students (due > 5000)
    const highDueStudents = await Student.countDocuments({
      branchId,
      status: 'ACTIVE',
      dueAmount: { $gt: 5000 },
    });
    if (highDueStudents > 0) {
      alerts.push({
        type: 'HIGH_DUE',
        message: `${highDueStudents} student(s) have high due amounts`,
        count: highDueStudents,
      });
    }

    // Dropped students
    const droppedStudents = await Student.countDocuments({
      branchId,
      status: 'DROPPED',
    });
    if (droppedStudents > 0) {
      alerts.push({
        type: 'DROPPED_STUDENT',
        message: `${droppedStudents} student(s) are dropped`,
        count: droppedStudents,
      });
    }

    // Pending students (staff registered, not approved)
    const pendingStudents = await Student.countDocuments({
      branchId,
      status: 'PENDING',
    });
    if (pendingStudents > 0) {
      alerts.push({
        type: 'PENDING_APPROVAL',
        message: `${pendingStudents} student(s) pending approval`,
        count: pendingStudents,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalStaff,
        todayStudentAttendancePercentage,
        todayStaffAttendancePercentage,
        currentMonthFeeCollection,
        totalDueFees,
        alerts,
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard summary',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getDashboardSummary,
};

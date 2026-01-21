const Branch = require('../models/branch.model');
const Student = require('../models/student.model');
const User = require('../models/user.model');
const Attendance = require('../models/attendance.model');
const Payment = require('../models/payment.model');
const config = require('../config/env.config');

const getDashboardSummary = async (req, res) => {
  try {
    const [totalBranches, totalStudents, totalStaff, inactiveBranches, blockedAdmins] = await Promise.all([
      Branch.countDocuments({ isDeleted: false }),
      Student.countDocuments({}),
      User.countDocuments({ role: { $in: ['ADMIN', 'STAFF'] }, isActive: true }),
      Branch.countDocuments({ status: 'LOCKED', isDeleted: false }),
      User.countDocuments({ role: 'ADMIN', isActive: false }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [attendanceTotal, attendancePresent] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: todayStart, $lte: todayEnd } }),
      Attendance.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd },
        status: 'Present',
      }),
    ]);

    const todayAttendancePercentage =
      attendanceTotal === 0 ? 0 : Math.round((attendancePresent / attendanceTotal) * 100);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyPayments = await Payment.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ['$amount', '$discount'] } },
        },
      },
    ]);

    const totalMonthlyIncome = monthlyPayments[0]?.total || 0;

    const dueAmounts = await Student.aggregate([
      { $group: { _id: null, totalDue: { $sum: '$dueAmount' } } },
    ]);
    const totalDueAmount = dueAmounts[0]?.totalDue || 0;

    res.status(200).json({
      success: true,
      data: {
        totalBranches,
        totalStudents,
        totalStaff,
        todayAttendancePercentage,
        totalMonthlyIncome,
        totalDueAmount,
        inactiveBranches,
        blockedAdmins,
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

const getDashboardGraphs = async (req, res) => {
  try {
    const branchWiseIncome = await Payment.aggregate([
      {
        $group: {
          _id: '$branchId',
          total: { $sum: { $subtract: ['$amount', '$discount'] } },
        },
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch',
        },
      },
      {
        $project: {
          branchId: '$_id',
          branchName: { $ifNull: [{ $arrayElemAt: ['$branch.name', 0] }, 'Unknown'] },
          total: 1,
          _id: 0,
        },
      },
    ]);

    const monthlyStudentGrowth = await Student.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          total: 1,
          _id: 0,
        },
      },
    ]);

    const dueVsCollectedFees = await Student.aggregate([
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$dueAmount' },
        },
      },
    ]);

    const collectedTotals = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: { $subtract: ['$amount', '$discount'] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        branchWiseIncome,
        monthlyStudentGrowth,
        dueVsCollectedFees: {
          totalDue: dueVsCollectedFees[0]?.totalDue || 0,
          totalCollected: collectedTotals[0]?.totalCollected || 0,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard graphs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard graphs',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getDashboardSummary,
  getDashboardGraphs,
};


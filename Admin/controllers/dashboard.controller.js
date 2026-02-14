const Student = require('../models/student.model');
const Staff = require('../models/staff.model');
const Teacher = require('../models/teacher.model');
const Batch = require('../models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const { StudentAttendance, StaffAttendance } = require('../models/attendance.model');
const Payment = require('../models/payment.model');
const Exam = require('../models/exam.model');
const Result = require('../models/result.model');
const Inquiry = require('../models/inquiry.model');
const Certificate = require('../models/certificate.model');
const RecordedClass = require('../models/recordedClass.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

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

/**
 * Get Comprehensive Dashboard Data
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const branchId = req.branchId;
    const now = new Date();
    
    // ============================================
    // OVERVIEW STATISTICS
    // ============================================
    const [
      totalStudents,
      activeStudents,
      pendingStudents,
      droppedStudents,
      totalStaff,
      activeStaff,
      totalTeachers,
      activeTeachers,
      totalBatches,
      activeBatches,
      totalCourses,
      totalExams,
      totalResults,
      totalInquiries,
      newInquiries,
      totalCertificates,
      totalRecordedClasses,
    ] = await Promise.all([
      Student.countDocuments({ branchId }),
      Student.countDocuments({ branchId, status: 'ACTIVE' }),
      Student.countDocuments({ branchId, status: 'PENDING' }),
      Student.countDocuments({ branchId, status: 'DROPPED' }),
      Staff.countDocuments({ branchId }),
      Staff.countDocuments({ branchId, isActive: true }),
      Teacher.countDocuments({ branchId }),
      Teacher.countDocuments({ branchId, isActive: true }),
      Batch.countDocuments({ branchId }),
      Batch.countDocuments({ branchId, isActive: true }),
      Course.countDocuments({ approvalStatus: 'APPROVED' }),
      Exam.countDocuments({ branchId }),
      Result.countDocuments({ branchId }),
      Inquiry.countDocuments({ branchId }),
      Inquiry.countDocuments({ branchId, status: 'NEW' }),
      Certificate.countDocuments({ branchId }),
      RecordedClass.countDocuments({ branchId, isActive: true }),
    ]);

    // ============================================
    // TODAY'S STATISTICS
    // ============================================
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayStudentAttendance, todayStaffAttendance, todayPayments, todayNewStudents, todayNewInquiries] = await Promise.all([
      StudentAttendance.find({ branchId, date: { $gte: todayStart, $lte: todayEnd } }),
      StaffAttendance.find({ branchId, date: { $gte: todayStart, $lte: todayEnd } }),
      Payment.find({ branchId, createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Student.countDocuments({ branchId, createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Inquiry.countDocuments({ branchId, createdAt: { $gte: todayStart, $lte: todayEnd } }),
    ]);

    const todayStudentPresent = todayStudentAttendance.filter(a => a.status === 'Present').length;
    const todayStudentTotal = todayStudentAttendance.length;
    const todayStudentAttendancePercentage = todayStudentTotal === 0 ? 0 : Math.round((todayStudentPresent / todayStudentTotal) * 100);

    const todayStaffPresent = todayStaffAttendance.filter(a => a.status === 'Present').length;
    const todayStaffTotal = todayStaffAttendance.length;
    const todayStaffAttendancePercentage = todayStaffTotal === 0 ? 0 : Math.round((todayStaffPresent / todayStaffTotal) * 100);

    const todayFeeCollection = todayPayments.reduce((sum, p) => sum + (p.amount - (p.discount || 0)), 0);

    // ============================================
    // CURRENT MONTH STATISTICS
    // ============================================
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $subtract: ['$amount', { $ifNull: ['$discount', 0] }] } },
          count: { $sum: 1 },
        },
      },
    ]);

    const currentMonthFeeCollection = monthlyPayments[0]?.total || 0;
    const currentMonthPaymentCount = monthlyPayments[0]?.count || 0;

    // Total due fees
    const dueAmounts = await Student.aggregate([
      { $match: { branchId: new mongoose.Types.ObjectId(branchId), status: 'ACTIVE' } },
      { $group: { _id: null, totalDue: { $sum: '$dueAmount' } } },
    ]);
    const totalDueFees = dueAmounts[0]?.totalDue || 0;

    // ============================================
    // ATTENDANCE CHARTS DATA (Last 7 Days)
    // ============================================
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      last7Days.push({ start: date, end: dateEnd, label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) });
    }

    const attendanceChartData = await Promise.all(
      last7Days.map(async (day) => {
        const [studentAtt, staffAtt] = await Promise.all([
          StudentAttendance.find({ branchId, date: { $gte: day.start, $lte: day.end } }),
          StaffAttendance.find({ branchId, date: { $gte: day.start, $lte: day.end } }),
        ]);
        const studentPresent = studentAtt.filter(a => a.status === 'Present').length;
        const staffPresent = staffAtt.filter(a => a.status === 'Present').length;
        return {
          date: day.label,
          studentAttendance: studentAtt.length === 0 ? 0 : Math.round((studentPresent / studentAtt.length) * 100),
          staffAttendance: staffAtt.length === 0 ? 0 : Math.round((staffPresent / staffAtt.length) * 100),
          studentPresent,
          studentTotal: studentAtt.length,
          staffPresent,
          staffTotal: staffAtt.length,
        };
      })
    );

    // ============================================
    // FEE COLLECTION CHART DATA (Last 6 Months)
    // ============================================
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      last6Months.push({
        start: date,
        end: monthEnd,
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      });
    }

    const feeCollectionChartData = await Promise.all(
      last6Months.map(async (month) => {
        const payments = await Payment.aggregate([
          {
            $match: {
              branchId: new mongoose.Types.ObjectId(branchId),
              createdAt: { $gte: month.start, $lte: month.end },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $subtract: ['$amount', { $ifNull: ['$discount', 0] }] } },
              count: { $sum: 1 },
            },
          },
        ]);
        return {
          month: month.label,
          amount: payments[0]?.total || 0,
          count: payments[0]?.count || 0,
        };
      })
    );

    // ============================================
    // STUDENT STATUS DISTRIBUTION
    // ============================================
    const studentStatusDistribution = await Student.aggregate([
      { $match: { branchId: new mongoose.Types.ObjectId(branchId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // ============================================
    // COURSE ENROLLMENT DISTRIBUTION
    // ============================================
    const courseEnrollment = await Student.aggregate([
      { $match: { branchId: new mongoose.Types.ObjectId(branchId), status: 'ACTIVE' } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
      { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      { $project: { courseName: '$course.name', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // ============================================
    // BATCH CAPACITY UTILIZATION
    // ============================================
    const batchUtilization = await Batch.aggregate([
      { $match: { branchId: new mongoose.Types.ObjectId(branchId), isActive: true } },
      { $project: { name: 1, currentStudents: 1, maxStudents: 1, utilization: { $multiply: [{ $divide: ['$currentStudents', '$maxStudents'] }, 100] } } },
      { $sort: { utilization: -1 } },
      { $limit: 10 },
    ]);

    // ============================================
    // PAYMENT MODE BREAKDOWN (Current Month)
    // ============================================
    const paymentModeBreakdown = await Payment.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: '$paymentMode',
          count: { $sum: 1 },
          total: { $sum: { $subtract: ['$amount', { $ifNull: ['$discount', 0] }] } },
        },
      },
    ]);

    // ============================================
    // RECENT ACTIVITIES (Last 10)
    // ============================================
    const recentStudents = await Student.find({ branchId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('studentId studentName status createdAt')
      .lean();

    const recentPayments = await Payment.find({ branchId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'studentId studentName')
      .select('studentId amount paymentMode createdAt')
      .lean();

    // ============================================
    // ALERTS
    // ============================================
    const alerts = [];

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

    if (pendingStudents > 0) {
      alerts.push({
        type: 'PENDING_APPROVAL',
        message: `${pendingStudents} student(s) pending approval`,
        count: pendingStudents,
      });
    }

    if (droppedStudents > 0) {
      alerts.push({
        type: 'DROPPED_STUDENT',
        message: `${droppedStudents} student(s) are dropped`,
        count: droppedStudents,
      });
    }

    if (newInquiries > 0) {
      alerts.push({
        type: 'NEW_INQUIRIES',
        message: `${newInquiries} new inquiry/inquiries`,
        count: newInquiries,
      });
    }

    // ============================================
    // PERFORMANCE METRICS
    // ============================================
    const avgBatchUtilization = batchUtilization.length > 0
      ? Math.round(batchUtilization.reduce((sum, b) => sum + (b.utilization || 0), 0) / batchUtilization.length)
      : 0;

    const totalBatchCapacity = await Batch.aggregate([
      { $match: { branchId: new mongoose.Types.ObjectId(branchId), isActive: true } },
      { $group: { _id: null, totalCapacity: { $sum: '$maxStudents' }, totalCurrent: { $sum: '$currentStudents' } } },
    ]);

    const overallBatchUtilization = totalBatchCapacity[0]?.totalCapacity > 0
      ? Math.round((totalBatchCapacity[0].totalCurrent / totalBatchCapacity[0].totalCapacity) * 100)
      : 0;

    // ============================================
    // RESPONSE
    // ============================================
    res.status(200).json({
      success: true,
      data: {
        // Overview Statistics
        overview: {
          totalStudents,
          activeStudents,
          pendingStudents,
          droppedStudents,
          totalStaff,
          activeStaff,
          totalTeachers,
          activeTeachers,
          totalBatches,
          activeBatches,
          totalCourses,
          totalExams,
          totalResults,
          totalInquiries,
          newInquiries,
          totalCertificates,
          totalRecordedClasses,
        },
        // Today's Statistics
        today: {
          studentAttendance: {
            percentage: todayStudentAttendancePercentage,
            present: todayStudentPresent,
            total: todayStudentTotal,
          },
          staffAttendance: {
            percentage: todayStaffAttendancePercentage,
            present: todayStaffPresent,
            total: todayStaffTotal,
          },
          feeCollection: todayFeeCollection,
          newStudents: todayNewStudents,
          newInquiries: todayNewInquiries,
        },
        // Current Month Statistics
        currentMonth: {
          feeCollection: currentMonthFeeCollection,
          paymentCount: currentMonthPaymentCount,
          totalDueFees,
        },
        // Charts Data
        charts: {
          attendance: attendanceChartData,
          feeCollection: feeCollectionChartData,
          studentStatus: studentStatusDistribution.map(s => ({ status: s._id, count: s.count })),
          courseEnrollment: courseEnrollment.map(c => ({ courseName: c.courseName || 'Unknown', count: c.count })),
          batchUtilization: batchUtilization.map(b => ({
            batchName: b.name,
            current: b.currentStudents,
            max: b.maxStudents,
            utilization: Math.round(b.utilization || 0),
          })),
          paymentMode: paymentModeBreakdown.map(p => ({
            mode: p._id,
            count: p.count,
            total: p.total,
          })),
        },
        // Recent Activities
        recentActivities: {
          students: recentStudents,
          payments: recentPayments,
        },
        // Alerts
        alerts,
        // Performance Metrics
        performance: {
          avgBatchUtilization,
          overallBatchUtilization,
          totalBatchCapacity: totalBatchCapacity[0]?.totalCapacity || 0,
          totalBatchCurrent: totalBatchCapacity[0]?.totalCurrent || 0,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getDashboardSummary,
  getDashboard,
};

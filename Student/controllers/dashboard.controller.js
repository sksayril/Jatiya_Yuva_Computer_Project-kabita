const Student = require('../../Admin/models/student.model');
const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Payment = require('../../Admin/models/payment.model');
const Exam = require('../../Admin/models/exam.model');
const Result = require('../../Admin/models/result.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Student Dashboard Summary
 * GET /api/student/dashboard/summary
 */
const getDashboardSummary = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;

    // Get student details
    const student = await Student.findById(studentId).populate('batchId', 'name timeSlot teacherId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's class status
    const todayAttendance = await StudentAttendance.findOne({
      branchId,
      studentId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const todayClassStatus = todayAttendance
      ? {
          status: todayAttendance.status,
          timeSlot: todayAttendance.timeSlot,
          marked: true,
        }
      : {
          status: 'Not Marked',
          timeSlot: student.batchTime,
          marked: false,
        };

    // Calculate attendance percentage
    const totalAttendances = await StudentAttendance.countDocuments({
      branchId,
      studentId,
    });

    const presentCount = await StudentAttendance.countDocuments({
      branchId,
      studentId,
      status: 'Present',
    });

    const attendancePercentage =
      totalAttendances === 0
        ? 0
        : Math.round((presentCount / totalAttendances) * 100);

    // Monthly fee status
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          studentId: new mongoose.Types.ObjectId(studentId),
          month: currentMonth,
          year: currentYear,
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: { $subtract: ['$amount', '$discount'] } },
        },
      },
    ]);

    const monthlyPaid = monthlyPayments[0]?.totalPaid || 0;
    const monthlyFee = student.monthlyFees || 0;
    const feeStatus = monthlyPaid >= monthlyFee ? 'Paid' : 'Due';
    const dueAmount = Math.max(0, monthlyFee - monthlyPaid);

    // Calculate next due date (based on registration date)
    let nextDueDate = null;
    if (student.admissionDate) {
      const admissionDate = new Date(student.admissionDate);
      const currentDate = new Date();
      const monthsSinceAdmission = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 +
        (currentDate.getMonth() - admissionDate.getMonth());
      
      // Next due date is the same day of next month
      nextDueDate = new Date(admissionDate);
      nextDueDate.setMonth(admissionDate.getMonth() + monthsSinceAdmission + 1);
    }

    // Notifications
    const notifications = [];

    // Due payment alert
    if (dueAmount > 0) {
      notifications.push({
        type: 'DUE_PAYMENT',
        message: `You have ₹${dueAmount} due for ${currentMonth}`,
        amount: dueAmount,
        priority: 'HIGH',
      });
    }

    // Upcoming exams
    const upcomingExams = await Exam.find({
      branchId,
      examDate: { $gte: todayStart },
      status: 'ACTIVE',
    })
      .sort({ examDate: 1 })
      .limit(3)
      .select('examName examType examDate');

    if (upcomingExams.length > 0) {
      notifications.push({
        type: 'UPCOMING_EXAM',
        message: `${upcomingExams.length} upcoming exam(s)`,
        exams: upcomingExams.map((e) => ({
          name: e.examName,
          type: e.examType,
          date: e.examDate,
        })),
        priority: 'MEDIUM',
      });
    }

    // Exam blocked if dues pending
    if (dueAmount > 0 && upcomingExams.length > 0) {
      notifications.push({
        type: 'EXAM_BLOCKED',
        message: 'Exams may be blocked due to pending fees',
        priority: 'HIGH',
      });
    }

    // Class notifications
    if (student.batchId) {
      notifications.push({
        type: 'CLASS_REMINDER',
        message: `Today's class: ${student.batchTime || 'Check schedule'}`,
        batchTime: student.batchTime,
        priority: 'LOW',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        todayClassStatus,
        attendancePercentage,
        monthlyFeeStatus: {
          status: feeStatus,
          monthlyFee,
          monthlyPaid,
          dueAmount,
          nextDueDate,
        },
        notifications,
      },
    });
  } catch (error) {
    console.error('Student dashboard summary error:', error);
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

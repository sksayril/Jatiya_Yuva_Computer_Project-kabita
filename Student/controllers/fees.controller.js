const Student = require('../../Admin/models/student.model');
const Payment = require('../../Admin/models/payment.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Student Fees Status
 * GET /api/student/fees
 */
const getFees = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;

    const student = await Student.findById(studentId).select(
      'studentId studentName totalFees paidAmount dueAmount admissionDate monthlyFees'
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Calculate next due date based on registration date
    let nextDueDate = null;
    let nextDueAmount = 0;
    if (student.admissionDate) {
      const admissionDate = new Date(student.admissionDate);
      const currentDate = new Date();
      const monthsSinceAdmission = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 +
        (currentDate.getMonth() - admissionDate.getMonth());
      
      // Calculate how many months have been paid
      const monthlyPayments = await Payment.aggregate([
        {
          $match: {
            branchId: new mongoose.Types.ObjectId(branchId),
            studentId: new mongoose.Types.ObjectId(studentId),
          },
        },
        {
          $group: {
            _id: { month: '$month', year: '$year' },
            totalPaid: { $sum: { $subtract: ['$amount', '$discount'] } },
          },
        },
      ]);

      const paidMonths = monthlyPayments.length;
      const nextMonthToPay = monthsSinceAdmission + 1;
      
      if (paidMonths < nextMonthToPay) {
        // Next due date is the same day of next unpaid month
        nextDueDate = new Date(admissionDate);
        nextDueDate.setMonth(admissionDate.getMonth() + nextMonthToPay);
        nextDueAmount = student.monthlyFees || 0;
      }
    }

    // Payment history summary
    const paymentHistory = await Payment.find({
      branchId,
      studentId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount paymentMode receiptNumber month year createdAt');

    res.status(200).json({
      success: true,
      data: {
        studentId: student.studentId,
        studentName: student.studentName,
        fees: {
          totalFees: student.totalFees || 0,
          paidAmount: student.paidAmount || 0,
          dueAmount: student.dueAmount || 0,
          monthlyFees: student.monthlyFees || 0,
        },
        nextDue: {
          date: nextDueDate,
          amount: nextDueAmount,
        },
        registrationDate: student.admissionDate,
        recentPayments: paymentHistory,
      },
    });
  } catch (error) {
    console.error('Get student fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching fees information',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getFees,
};

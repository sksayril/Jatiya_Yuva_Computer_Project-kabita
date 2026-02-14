const Payment = require('../../Admin/models/payment.model');
const Student = require('../../Admin/models/student.model');
const Branch = require('../../SuperAdmin/models/branch.model');
const { generateReceiptNumber } = require('../../Admin/utils/idGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Create Online Payment
 * POST /api/student/payments
 * Online payment only (UPI / QR / Gateway)
 */
const createPayment = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { amount, paymentMode, transactionId, description, month, year } = req.body;

    if (!amount || !paymentMode || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, paymentMode, transactionId',
      });
    }

    // Verify payment mode is online
    const onlineModes = ['UPI', 'ONLINE', 'QR', 'GATEWAY'];
    if (!onlineModes.includes(paymentMode.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Only online payment modes are allowed: UPI, ONLINE, QR, GATEWAY',
      });
    }

    // Get student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (student.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be made by active students',
      });
    }

    // Generate receipt number
    const branch = await Branch.findById(branchId);
    const receiptNumber = await generateReceiptNumber(branch.code, Payment);

    // Determine month and year
    const paymentDate = new Date();
    const paymentMonth = month || paymentDate.toLocaleString('default', { month: 'long' });
    const paymentYear = year || paymentDate.getFullYear();

    // Create payment record
    const payment = await Payment.create({
      branchId,
      studentId,
      amount: Number(amount),
      paymentMode: paymentMode.toUpperCase(),
      discount: 0, // Students cannot apply discounts
      description: description?.trim() || `Online payment via ${paymentMode}`,
      receiptNumber,
      month: paymentMonth,
      year: paymentYear,
      transactionId: transactionId.trim(),
      collectedBy: studentId, // Self payment
    });

    // Update student payment info
    const netAmount = Number(amount);
    const newPaidAmount = (student.paidAmount || 0) + netAmount;
    const newDueAmount = Math.max(0, (student.dueAmount || 0) - netAmount);

    await Student.findByIdAndUpdate(studentId, {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      lastPaymentDate: new Date(),
    });

    // Generate receipt PDF (placeholder)
    const receiptPdfUrl = ''; // Placeholder - implement PDF generation

    await logAudit({
      branchId,
      userId: studentId,
      role: 'STUDENT',
      action: 'CREATE_ONLINE_PAYMENT',
      module: 'PAYMENT',
      entityId: payment._id.toString(),
      newData: { amount: netAmount, paymentMode, transactionId, receiptNumber },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        ...payment.toObject(),
        receiptPdfUrl,
        note: 'Receipt will be generated automatically',
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing payment',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Payment History
 * GET /api/student/payments
 * Comprehensive payment history with statistics and upcoming payment information
 * Uses aggregation for optimal performance
 */
const getPayments = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { page = 1, limit = 20 } = req.query;

    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Current month info
    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentYear = today.getFullYear();

    // Get student info for monthly fees and admission date
    const student = await Student.findById(studentId)
      .select('monthlyFees admissionDate totalFees paidAmount dueAmount')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Parallel queries using aggregation for optimal performance
    const [
      payments,
      total,
      paymentStats,
      monthlyPayment,
      monthlyBreakdown,
    ] = await Promise.all([
      // Get paginated payments
      Payment.find({
        branchId: branchObjectId,
        studentId: studentObjectId,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      // Total count
      Payment.countDocuments({
        branchId: branchObjectId,
        studentId: studentObjectId,
      }),

      // Payment statistics using aggregation
      Payment.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
          },
        },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalPaid: { $sum: { $subtract: ['$amount', '$discount'] } },
            averageAmount: { $avg: { $subtract: ['$amount', '$discount'] } },
            firstPayment: { $min: '$createdAt' },
            lastPayment: { $max: '$createdAt' },
          },
        },
        {
          $project: {
            _id: 0,
            totalPayments: 1,
            totalPaid: 1,
            averageAmount: { $round: ['$averageAmount', 2] },
            firstPayment: 1,
            lastPayment: 1,
          },
        },
      ]),

      // Current month payment status
      Payment.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
            month: currentMonth,
            year: currentYear,
          },
        },
        {
          $group: {
            _id: null,
            monthlyPaid: { $sum: { $subtract: ['$amount', '$discount'] } },
            paymentCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            monthlyPaid: 1,
            paymentCount: 1,
          },
        },
      ]),

      // Monthly breakdown (last 12 months)
      Payment.aggregate([
        {
          $match: {
            branchId: branchObjectId,
            studentId: studentObjectId,
          },
        },
        {
          $group: {
            _id: {
              month: '$month',
              year: '$year',
            },
            totalPaid: { $sum: { $subtract: ['$amount', '$discount'] } },
            paymentCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            month: '$_id.month',
            year: '$_id.year',
            totalPaid: 1,
            paymentCount: 1,
          },
        },
        {
          $sort: { year: -1, month: -1 },
        },
        {
          $limit: 12,
        },
      ]),
    ]);

    // Process statistics
    const stats = paymentStats[0] || {
      totalPayments: 0,
      totalPaid: 0,
      averageAmount: 0,
      firstPayment: null,
      lastPayment: null,
    };

    const monthlyPaymentData = monthlyPayment[0] || {
      monthlyPaid: 0,
      paymentCount: 0,
    };

    // Calculate upcoming payment information
    const monthlyFee = student.monthlyFees || 0;
    const monthlyPaid = monthlyPaymentData.monthlyPaid || 0;
    const monthlyDueAmount = Math.max(0, monthlyFee - monthlyPaid);
    const monthlyStatus = monthlyPaid >= monthlyFee ? 'Paid' : 'Due';

    // Calculate next due date
    let nextDueDate = null;
    let daysUntilDue = null;
    if (student.admissionDate) {
      const admissionDate = new Date(student.admissionDate);
      const monthsSinceAdmission =
        (today.getFullYear() - admissionDate.getFullYear()) * 12 +
        (today.getMonth() - admissionDate.getMonth());
      nextDueDate = new Date(admissionDate);
      nextDueDate.setMonth(admissionDate.getMonth() + monthsSinceAdmission + 1);

      // Calculate days until due
      const daysDiff = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));
      daysUntilDue = daysDiff;
    }

    // Calculate total fees and progress
    const totalFees = student.totalFees || 0;
    const paidAmount = stats.totalPaid || student.paidAmount || 0;
    const dueAmount = Math.max(0, totalFees - paidAmount);
    const paymentProgress = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 0;

    // Build upcoming payment info
    const upcomingPayment = {
      month: currentMonth,
      year: currentYear,
      monthlyFee: monthlyFee,
      monthlyPaid: monthlyPaid,
      dueAmount: monthlyDueAmount,
      status: monthlyStatus,
      nextDueDate: nextDueDate,
      daysUntilDue: daysUntilDue,
      isOverdue: daysUntilDue !== null && daysUntilDue < 0,
      message:
        monthlyStatus === 'Paid'
          ? `Payment for ${currentMonth} ${currentYear} is complete`
          : monthlyDueAmount > 0
          ? `You have ₹${monthlyDueAmount} due for ${currentMonth} ${currentYear}`
          : `No payment due for ${currentMonth} ${currentYear}`,
    };

    res.status(200).json({
      success: true,
      data: {
        payments: payments.map((p) => ({
          _id: p._id,
          amount: p.amount,
          discount: p.discount || 0,
          netAmount: p.amount - (p.discount || 0),
          paymentMode: p.paymentMode,
          receiptNumber: p.receiptNumber,
          month: p.month,
          year: p.year,
          description: p.description,
          transactionId: p.transactionId,
          receiptPdfUrl: p.receiptPdfUrl || '',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
        statistics: {
          totalPayments: stats.totalPayments,
          totalPaid: stats.totalPaid,
          averageAmount: stats.averageAmount,
          totalFees: totalFees,
          paidAmount: paidAmount,
          dueAmount: dueAmount,
          paymentProgress: paymentProgress,
          firstPayment: stats.firstPayment,
          lastPayment: stats.lastPayment,
        },
        upcomingPayment: upcomingPayment,
        monthlyBreakdown: monthlyBreakdown.map((m) => ({
          month: m.month,
          year: m.year,
          totalPaid: m.totalPaid,
          paymentCount: m.paymentCount,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment history',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Download Receipt PDF
 * GET /api/student/payments/:id/receipt
 */
const downloadReceipt = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { id } = req.params;

    const payment = await Payment.findOne({
      _id: id,
      branchId,
      studentId, // Ensure student can only download their own receipts
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment receipt not found or access denied',
      });
    }

    // Placeholder for PDF generation
    // In production, generate PDF and return file or URL
    res.status(200).json({
      success: true,
      message: 'Receipt download (placeholder)',
      data: {
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        paymentMode: payment.paymentMode,
        date: payment.createdAt,
        receiptPdfUrl: payment.receiptPdfUrl || '',
        note: 'PDF generation will be implemented',
      },
    });
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading receipt',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
  downloadReceipt,
};

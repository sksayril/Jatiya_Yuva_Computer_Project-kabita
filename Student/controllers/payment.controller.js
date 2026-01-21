const Payment = require('../../Admin/models/payment.model');
const Student = require('../../Admin/models/student.model');
const Branch = require('../../SuperAdmin/models/branch.model');
const { generateReceiptNumber } = require('../../Admin/utils/idGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

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
 */
const getPayments = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { page = 1, limit = 20 } = req.query;

    const query = { branchId, studentId };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
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

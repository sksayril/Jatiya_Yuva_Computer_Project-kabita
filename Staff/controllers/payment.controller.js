const Payment = require('../../Admin/models/payment.model');
const Student = require('../../Admin/models/student.model');
const Branch = require('../../SuperAdmin/models/branch.model');
const { generateReceiptNumber } = require('../../Admin/utils/idGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Payment (Limited - No Discount)
 * POST /api/staff/payments
 * Staff can collect fees but cannot apply discounts
 */
const createPayment = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { studentId, amount, paymentMode, description, month, year } = req.body;

    if (!studentId || !amount || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, amount, paymentMode',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ _id: studentId, branchId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or does not belong to your branch',
      });
    }

    if (student.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be accepted for active students',
      });
    }

    // Staff cannot apply discount - set to 0
    const discount = 0;
    const netAmount = Number(amount);

    // Generate receipt number
    const branch = await Branch.findById(branchId);
    const receiptNumber = await generateReceiptNumber(branch.code, Payment);

    // Determine month and year
    const paymentDate = new Date();
    const paymentMonth = month || paymentDate.toLocaleString('default', { month: 'long' });
    const paymentYear = year || paymentDate.getFullYear();

    // Create payment
    const payment = await Payment.create({
      branchId,
      studentId,
      amount: netAmount,
      paymentMode,
      discount: 0, // Staff cannot apply discounts
      description: description?.trim(),
      receiptNumber,
      month: paymentMonth,
      year: paymentYear,
      collectedBy: staffId,
    });

    // Update student payment info
    const newPaidAmount = (student.paidAmount || 0) + netAmount;
    const newDueAmount = Math.max(0, (student.dueAmount || 0) - netAmount);

    await Student.findByIdAndUpdate(studentId, {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      lastPaymentDate: new Date(),
    });

    // Generate receipt PDF (placeholder)
    const receiptPdfUrl = ''; // Placeholder

    await logAudit({
      branchId,
      userId: staffId,
      role: 'STAFF',
      action: 'CREATE_PAYMENT',
      module: 'PAYMENT',
      entityId: payment._id.toString(),
      newData: { studentId, amount: netAmount, receiptNumber },
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
      message: 'Server error while recording payment',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Payments (by staff)
 * GET /api/staff/payments
 */
const getPayments = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { studentId, page = 1, limit = 20 } = req.query;

    const query = { branchId, collectedBy: staffId };
    if (studentId) query.studentId = studentId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('studentId', 'studentId studentName mobileNumber')
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
      message: 'Server error while fetching payments',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
};

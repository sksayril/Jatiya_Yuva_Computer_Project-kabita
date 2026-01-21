const Payment = require('../models/payment.model');
const Student = require('../models/student.model');
const { generateReceiptNumber } = require('../utils/idGenerator');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Create Payment
 * POST /api/admin/payments
 */
const createPayment = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { studentId, amount, paymentMode, discount, description, month, year } = req.body;

    if (!studentId || !amount || !paymentMode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, amount, paymentMode',
      });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ _id: studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be accepted for active students',
      });
    }

    // Calculate net amount
    const netAmount = Math.max(0, amount - (discount || 0));

    // Generate receipt number
    const Branch = require('../../SuperAdmin/models/branch.model');
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
      amount: Number(amount),
      paymentMode,
      discount: discount || 0,
      description: description?.trim(),
      receiptNumber,
      month: paymentMonth,
      year: paymentYear,
      collectedBy: req.user.id,
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
    // TODO: Implement PDF generation
    const receiptPdfUrl = ''; // Placeholder

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'PAYMENT',
      entityId: payment._id,
      newData: { studentId, amount, receiptNumber },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        ...payment.toObject(),
        receiptPdfUrl,
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
 * Get Payments
 * GET /api/admin/payments
 */
const getPayments = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { studentId, startDate, endDate, paymentMode } = req.query;

    const query = { branchId };
    if (studentId) query.studentId = studentId;
    if (paymentMode) query.paymentMode = paymentMode;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'studentId name mobile')
      .populate('collectedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
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

/**
 * Calculate Monthly Due for Student
 * Helper function to calculate due based on registration date
 */
const calculateMonthlyDue = async (studentId) => {
  const student = await Student.findById(studentId).populate('courseId');
  if (!student || !student.courseId) return 0;

  const registrationDate = new Date(student.registrationDate);
  const now = new Date();
  
  // Calculate months since registration
  const monthsDiff = (now.getFullYear() - registrationDate.getFullYear()) * 12 +
    (now.getMonth() - registrationDate.getMonth());

  // Monthly fee from course
  const monthlyFee = student.courseId.monthlyFees || 0;
  
  // Calculate expected total payment
  const expectedTotal = (monthsDiff + 1) * monthlyFee;
  
  // Calculate due
  const due = Math.max(0, expectedTotal - (student.paidAmount || 0));
  
  return due;
};

module.exports = {
  createPayment,
  getPayments,
  calculateMonthlyDue,
};

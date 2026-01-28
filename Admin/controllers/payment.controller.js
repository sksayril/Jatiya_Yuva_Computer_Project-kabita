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

    // Verify student belongs to branch - search by studentId (display ID)
    const student = await Student.findOne({ studentId, branchId });
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
    const paymentData = {
      branchId,
      studentId: student._id, // Use MongoDB _id for payment record
      amount: Number(amount),
      paymentMode,
      discount: discount || 0,
      description: description ? description.trim() : '',
      receiptNumber,
      month: paymentMonth,
      year: paymentYear,
    };

    // Add collectedBy if user ID is available
    if (req.user && req.user.id) {
      paymentData.collectedBy = req.user.id;
    }

    console.log('Payment data being created:', paymentData);
    const payment = await Payment.create(paymentData);
    console.log('Payment created:', payment.toObject());

    // Update student payment info
    const newPaidAmount = (student.paidAmount || 0) + netAmount;
    const newDueAmount = Math.max(0, (student.dueAmount || 0) - netAmount);

    await Student.findByIdAndUpdate(student._id, {
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
      newData: { studentId: student.studentId, amount, receiptNumber },
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
 * Get Payment by ID
 * GET /api/admin/payments/:id
 */
const getPaymentById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const payment = await Payment.findOne({ _id: id, branchId })
      .populate('studentId', 'studentId name mobile email');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Payment
 * POST /api/admin/payments/:id/update
 */
const updatePayment = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { amount, paymentMode, discount, description } = req.body;

    // Find payment
    const payment = await Payment.findOne({ _id: id, branchId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Store old payment info for audit and student update
    const oldAmount = payment.amount;
    const oldDiscount = payment.discount;
    const oldNetAmount = oldAmount - oldDiscount;

    // Calculate new net amount
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;
    const newDiscount = discount !== undefined ? Number(discount) : oldDiscount;
    const newNetAmount = newAmount - newDiscount;
    const amountDifference = newNetAmount - oldNetAmount;

    // Get student
    const student = await Student.findById(payment.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Store old data for audit log
    const oldData = {
      amount: oldAmount,
      paymentMode: payment.paymentMode,
      discount: oldDiscount,
      description: payment.description,
    };

    // Update payment
    const updateFields = {};
    if (amount !== undefined) updateFields.amount = newAmount;
    if (paymentMode) updateFields.paymentMode = paymentMode;
    if (discount !== undefined) updateFields.discount = newDiscount;
    if (description !== undefined) updateFields.description = description?.trim();

    const updatedPayment = await Payment.findByIdAndUpdate(id, updateFields, { new: true })
      .populate('studentId', 'studentId name mobile email');

    // Update student payment info if amount changed
    if (amountDifference !== 0) {
      const newPaidAmount = (student.paidAmount || 0) + amountDifference;
      const newDueAmount = Math.max(0, (student.dueAmount || 0) - amountDifference);

      await Student.findByIdAndUpdate(payment.studentId, {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
      });
    }

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'PAYMENT',
      entityId: payment._id,
      oldData,
      newData: updateFields,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedPayment,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Payment
 * POST /api/admin/payments/:id/delete
 */
const deletePayment = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Find payment
    const payment = await Payment.findOne({ _id: id, branchId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Get student and reverse the payment
    const student = await Student.findById(payment.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Calculate amount to reverse
    const netAmount = payment.amount - payment.discount;

    // Reverse student payment info
    const newPaidAmount = Math.max(0, (student.paidAmount || 0) - netAmount);
    const newDueAmount = (student.dueAmount || 0) + netAmount;

    await Student.findByIdAndUpdate(payment.studentId, {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
    });

    // Store old data for audit log
    const oldData = {
      amount: payment.amount,
      paymentMode: payment.paymentMode,
      discount: payment.discount,
      receiptNumber: payment.receiptNumber,
      description: payment.description,
    };

    // Delete payment
    await Payment.findByIdAndDelete(id);

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'PAYMENT',
      entityId: id,
      oldData,
      newData: null,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting payment',
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
  getPaymentById,
  updatePayment,
  deletePayment,
  calculateMonthlyDue,
};

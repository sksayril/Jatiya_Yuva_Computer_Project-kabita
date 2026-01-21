const Student = require('../../Admin/models/student.model');
const Payment = require('../../Admin/models/payment.model');
const Exam = require('../../Admin/models/exam.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Student Alerts
 * GET /api/student/alerts
 */
const getAlerts = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;

    const student = await Student.findById(studentId).select(
      'studentId dueAmount admissionDate monthlyFees'
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const alerts = [];

    // Due fees warning
    if (student.dueAmount > 0) {
      alerts.push({
        type: 'DUE_FEES_WARNING',
        message: `You have ₹${student.dueAmount} due. Please pay to avoid service interruption.`,
        amount: student.dueAmount,
        priority: 'HIGH',
        actionRequired: true,
      });
    }

    // Late payment notice
    if (student.admissionDate) {
      const admissionDate = new Date(student.admissionDate);
      const currentDate = new Date();
      const monthsSinceAdmission = (currentDate.getFullYear() - admissionDate.getFullYear()) * 12 +
        (currentDate.getMonth() - admissionDate.getMonth());
      
      // Check if current month is paid
      const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
      const currentYear = currentDate.getFullYear();
      
      const currentMonthPayment = await Payment.findOne({
        branchId,
        studentId,
        month: currentMonth,
        year: currentYear,
      });

      if (!currentMonthPayment && monthsSinceAdmission >= 0) {
        const daysPastDue = currentDate.getDate() - admissionDate.getDate();
        if (daysPastDue > 7) {
          alerts.push({
            type: 'LATE_PAYMENT_NOTICE',
            message: `Payment for ${currentMonth} is overdue by ${daysPastDue} days.`,
            daysOverdue: daysPastDue,
            priority: 'HIGH',
            actionRequired: true,
          });
        }
      }
    }

    // Exam blocked if dues pending
    if (student.dueAmount > 0) {
      const upcomingExams = await Exam.countDocuments({
        branchId,
        examDate: { $gte: new Date() },
        status: 'ACTIVE',
      });

      if (upcomingExams > 0) {
        alerts.push({
          type: 'EXAM_BLOCKED',
          message: 'Exams are blocked due to pending fees. Please clear dues to appear in exams.',
          priority: 'URGENT',
          actionRequired: true,
        });
      }
    }

    // Class reminders (if applicable)
    alerts.push({
      type: 'CLASS_REMINDER',
      message: 'Regular attendance is required for course completion.',
      priority: 'LOW',
      actionRequired: false,
    });

    res.status(200).json({
      success: true,
      data: {
        alerts,
        totalAlerts: alerts.length,
        urgentAlerts: alerts.filter((a) => a.priority === 'URGENT').length,
        highPriorityAlerts: alerts.filter((a) => a.priority === 'HIGH').length,
      },
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching alerts',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getAlerts,
};

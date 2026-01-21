const { StudentAttendance, StaffAttendance } = require('../models/attendance.model');
const Payment = require('../models/payment.model');
const Staff = require('../models/staff.model');
const { calculateStaffSalary } = require('./staff.controller');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Attendance Report
 * GET /api/admin/reports/attendance
 */
const getAttendanceReport = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { type, startDate, endDate, batchId, studentId } = req.query;

    if (!type || !['student', 'staff'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type is required and must be "student" or "staff"',
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(1); // First day of month
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    if (type === 'student') {
      const query = {
        branchId,
        date: { $gte: start, $lte: end },
      };
      if (batchId) query.batchId = batchId;
      if (studentId) query.studentId = studentId;

      const attendance = await StudentAttendance.find(query)
        .populate('studentId', 'studentId name')
        .populate('batchId', 'name timeSlot')
        .sort({ date: -1 });

      // Calculate summary
      const totalRecords = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'Present').length;
      const absentCount = attendance.filter(a => a.status === 'Absent').length;
      const lateCount = attendance.filter(a => a.status === 'Late').length;

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalRecords,
            presentCount,
            absentCount,
            lateCount,
            attendancePercentage: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
          },
          records: attendance,
        },
        export: {
          format: 'pdf', // Placeholder
          url: '', // TODO: Generate PDF
        },
      });
    } else {
      const query = {
        branchId,
        date: { $gte: start, $lte: end },
      };
      if (studentId) query.staffId = studentId; // Reusing studentId param for staffId

      const attendance = await StaffAttendance.find(query)
        .populate('staffId', 'staffId name role')
        .sort({ date: -1 });

      const totalRecords = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'Present').length;

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalRecords,
            presentCount,
            attendancePercentage: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
          },
          records: attendance,
        },
        export: {
          format: 'pdf',
          url: '',
        },
      });
    }
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating attendance report',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Fees Report
 * GET /api/admin/reports/fees
 */
const getFeesReport = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { startDate, endDate, studentId, paymentMode } = req.query;

    const query = {
      branchId: new mongoose.Types.ObjectId(branchId),
    };
    if (studentId) query.studentId = new mongoose.Types.ObjectId(studentId);
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

    // Calculate summary
    const totalCollection = payments.reduce((sum, p) => sum + (p.amount - (p.discount || 0)), 0);
    const totalDiscount = payments.reduce((sum, p) => sum + (p.discount || 0), 0);
    const cashPayments = payments.filter(p => p.paymentMode === 'CASH').length;
    const upiPayments = payments.filter(p => p.paymentMode === 'UPI').length;
    const onlinePayments = payments.filter(p => p.paymentMode === 'ONLINE').length;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCollection,
          totalDiscount,
          netCollection: totalCollection - totalDiscount,
          totalPayments: payments.length,
          paymentModeBreakdown: {
            cash: cashPayments,
            upi: upiPayments,
            online: onlinePayments,
          },
        },
        records: payments,
      },
      export: {
        format: 'excel', // Placeholder
        url: '', // TODO: Generate Excel
      },
    });
  } catch (error) {
    console.error('Get fees report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating fees report',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Salary Report
 * GET /api/admin/reports/salary
 */
const getSalaryReport = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { month, year, staffId } = req.query;

    const reportMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const reportYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const query = { branchId, isActive: true };
    if (staffId) query._id = staffId;

    const staffList = await Staff.find(query);

    // Calculate salary for each staff
    const salaryData = await Promise.all(
      staffList.map(async (staff) => {
        const salary = await calculateStaffSalary(staff._id, reportMonth, reportYear);
        return {
          staffId: staff.staffId,
          name: staff.name,
          role: staff.role,
          salaryType: staff.salaryType,
          salaryRate: staff.salaryRate,
          currentMonthClasses: staff.currentMonthClasses,
          calculatedSalary: salary,
        };
      })
    );

    const totalSalary = salaryData.reduce((sum, s) => sum + s.calculatedSalary, 0);

    res.status(200).json({
      success: true,
      data: {
        month: reportMonth,
        year: reportYear,
        summary: {
          totalStaff: staffList.length,
          totalSalary,
        },
        records: salaryData,
      },
      export: {
        format: 'pdf',
        url: '', // TODO: Generate salary slip PDFs
      },
    });
  } catch (error) {
    console.error('Get salary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating salary report',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getAttendanceReport,
  getFeesReport,
  getSalaryReport,
};

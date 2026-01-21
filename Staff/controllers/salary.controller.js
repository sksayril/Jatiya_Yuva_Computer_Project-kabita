const Staff = require('../../Admin/models/staff.model');
const { StaffAttendance } = require('../../Admin/models/attendance.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Staff Salary View (Read-Only)
 * GET /api/staff/salary
 */
const getSalary = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;

    // Get staff details
    const staff = await Staff.findOne({
      _id: staffId,
      branchId,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // Get current month attendance
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const currentMonthAttendances = await StaffAttendance.find({
      branchId,
      staffId,
      date: { $gte: monthStart },
      status: 'Present',
    });

    const currentMonthClasses = currentMonthAttendances.length;

    // Calculate current month salary based on salary type
    let currentMonthSalary = 0;
    if (staff.salaryType === 'PER_CLASS') {
      currentMonthSalary = currentMonthClasses * (staff.salaryRate || 0);
    } else if (staff.salaryType === 'MONTHLY_FIXED') {
      currentMonthSalary = staff.salaryRate || 0;
    } else if (staff.salaryType === 'HOURLY') {
      // Calculate total hours from attendances
      let totalHours = 0;
      for (const att of currentMonthAttendances) {
        if (att.checkIn && att.checkOut) {
          const hours = (new Date(att.checkOut) - new Date(att.checkIn)) / (1000 * 60 * 60);
          totalHours += hours;
        }
      }
      currentMonthSalary = totalHours * (staff.salaryRate || 0);
    }

    // Get month-wise breakdown (last 6 months)
    const monthWiseBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthDate);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthAttendances = await StaffAttendance.find({
        branchId,
        staffId,
        date: { $gte: monthDate, $lte: monthEnd },
        status: 'Present',
      });

      let monthSalary = 0;
      if (staff.salaryType === 'PER_CLASS') {
        monthSalary = monthAttendances.length * (staff.salaryRate || 0);
      } else if (staff.salaryType === 'MONTHLY_FIXED') {
        monthSalary = staff.salaryRate || 0;
      } else if (staff.salaryType === 'HOURLY') {
        let totalHours = 0;
        for (const att of monthAttendances) {
          if (att.checkIn && att.checkOut) {
            const hours = (new Date(att.checkOut) - new Date(att.checkIn)) / (1000 * 60 * 60);
            totalHours += hours;
          }
        }
        monthSalary = totalHours * (staff.salaryRate || 0);
      }

      monthWiseBreakdown.push({
        month: monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        year: monthDate.getFullYear(),
        monthNumber: monthDate.getMonth() + 1,
        attendanceCount: monthAttendances.length,
        salary: monthSalary,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        staffId: staff.staffId,
        name: staff.name,
        salaryType: staff.salaryType,
        salaryRate: staff.salaryRate,
        currentMonth: {
          attendanceCount: currentMonthClasses,
          salary: currentMonthSalary,
        },
        monthWiseBreakdown,
        note: 'This is a read-only view. Contact administrator for salary adjustments.',
      },
    });
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching salary information',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getSalary,
};

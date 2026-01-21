const Staff = require('../../Admin/models/staff.model');
const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Result = require('../../Admin/models/result.model');
const Batch = require('../../Admin/models/batch.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Teacher Performance View (Self - Read Only)
 * GET /api/teacher/performance
 */
const getPerformance = async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const branchId = req.branchId;
    const assignedBatches = req.assignedBatches;

    const teacher = await Staff.findById(teacherId).select('assignedBatches currentMonthClasses');
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Classes taken count (current month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const classesTaken = await StudentAttendance.distinct('date', {
      branchId,
      batchId: { $in: assignedBatches },
      markedBy: teacherId,
      date: { $gte: monthStart },
    });

    const classesTakenCount = classesTaken.length;

    // Student attendance trend (last 6 months)
    const attendanceTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthDate);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthAttendances = await StudentAttendance.find({
        branchId,
        batchId: { $in: assignedBatches },
        markedBy: teacherId,
        date: { $gte: monthDate, $lte: monthEnd },
      });

      const presentCount = monthAttendances.filter((a) => a.status === 'Present').length;
      const totalCount = monthAttendances.length;
      const attendancePercentage = totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);

      attendanceTrend.push({
        month: monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        year: monthDate.getFullYear(),
        monthNumber: monthDate.getMonth() + 1,
        totalClasses: totalCount,
        presentCount,
        attendancePercentage,
      });
    }

    // Exam result performance (batch-wise)
    const batchPerformance = await Promise.all(
      assignedBatches.map(async (batchId) => {
        const batch = await Batch.findById(batchId).select('name timeSlot');
        if (!batch) return null;

        const exams = await Exam.find({
          branchId,
          batchId,
          status: 'ACTIVE',
        });

        const examIds = exams.map((e) => e._id);

        const results = await Result.find({
          branchId,
          examId: { $in: examIds },
        });

        const passCount = results.filter((r) => r.status === 'PASS').length;
        const totalResults = results.length;
        const passPercentage = totalResults === 0 ? 0 : Math.round((passCount / totalResults) * 100);

        const avgMarks = totalResults === 0 ? 0 : Math.round(
          results.reduce((sum, r) => sum + r.marksObtained, 0) / totalResults
        );

        return {
          batchId: batch._id,
          batchName: batch.name,
          timeSlot: batch.timeSlot,
          totalExams: exams.length,
          totalResults,
          passCount,
          failCount: totalResults - passCount,
          passPercentage,
          averageMarks: avgMarks,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        teacherId: teacher.staffId,
        currentMonth: {
          classesTaken: classesTakenCount,
        },
        attendanceTrend,
        batchPerformance: batchPerformance.filter((b) => b !== null),
        note: 'This is a read-only performance view. Contact administrator for salary information.',
      },
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching performance data',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getPerformance,
};

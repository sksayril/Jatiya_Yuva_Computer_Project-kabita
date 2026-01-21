const { StudentAttendance } = require('../../Admin/models/attendance.model');
const FollowUp = require('../../Staff/models/followUp.model');
const Student = require('../../Admin/models/student.model');
const config = require('../config/env.config');

/**
 * Get Absence History (View Only)
 * GET /api/student/absence-history
 */
const getAbsenceHistory = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { page = 1, limit = 30 } = req.query;

    // Get absent attendances
    const query = {
      branchId,
      studentId,
      status: 'Absent',
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [absentAttendances, total] = await Promise.all([
      StudentAttendance.find(query)
        .populate('batchId', 'name timeSlot')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StudentAttendance.countDocuments(query),
    ]);

    // Get follow-ups for absent dates
    const absentDates = absentAttendances.map((a) => a.date);
    const followUps = await FollowUp.find({
      branchId,
      studentId,
      absentDate: { $in: absentDates },
    }).select('absentDate callStatus reason reasonDetails expectedReturnDate remarks followUpStatus');

    // Map follow-ups by date
    const followUpsMap = {};
    followUps.forEach((f) => {
      const dateKey = new Date(f.absentDate).toISOString().split('T')[0];
      followUpsMap[dateKey] = {
        callStatus: f.callStatus,
        reason: f.reason,
        reasonDetails: f.reasonDetails,
        expectedReturnDate: f.expectedReturnDate,
        remarks: f.remarks,
        followUpStatus: f.followUpStatus,
      };
    });

    // Enrich absent attendances with follow-up info
    const enrichedAbsences = absentAttendances.map((attendance) => {
      const dateKey = new Date(attendance.date).toISOString().split('T')[0];
      const followUp = followUpsMap[dateKey];

      return {
        date: attendance.date,
        batch: attendance.batchId,
        followUp: followUp || null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        absences: enrichedAbsences,
        summary: {
          totalAbsentDays: total,
          withFollowUp: followUps.length,
          withoutFollowUp: total - followUps.length,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        note: 'Absence history is read-only. Contact staff for any queries.',
      },
    });
  } catch (error) {
    console.error('Get absence history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching absence history',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getAbsenceHistory,
};

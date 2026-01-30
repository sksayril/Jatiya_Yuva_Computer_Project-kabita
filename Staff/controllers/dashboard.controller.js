const mongoose = require('mongoose');
const Student = require('../../Admin/models/student.model');
const { StudentAttendance, StaffAttendance } = require('../../Admin/models/attendance.model');
const Payment = require('../../Admin/models/payment.model');
const FollowUp = require('../models/followUp.model');
const Inquiry = require('../../Admin/models/inquiry.model');
const config = require('../config/env.config');

/**
 * Get Staff Dashboard Summary
 * GET /api/staff/dashboard/summary
 */
const getDashboardSummary = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Staff's own attendance status today
    const todayStaffAttendance = await StaffAttendance.findOne({
      branchId,
      staffId,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const selfAttendanceStatus = todayStaffAttendance
      ? {
          status: todayStaffAttendance.status,
          checkIn: todayStaffAttendance.checkIn,
          checkOut: todayStaffAttendance.checkOut,
        }
      : {
          status: 'Not Marked',
          checkIn: null,
          checkOut: null,
        };

    // Today's absent students count
    const todayPresentStudents = await StudentAttendance.distinct('studentId', {
      branchId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'Present',
    });

    const totalActiveStudents = await Student.countDocuments({
      branchId,
      status: 'ACTIVE',
    });

    const todayAbsentStudentsCount = totalActiveStudents - todayPresentStudents.length;

    // Students registered by this staff
    const studentsRegisteredByStaff = await Student.countDocuments({
      branchId,
      registeredBy: 'STAFF',
      registeredById: staffId,
    });

    // Pending follow-ups (by this staff)
    const pendingFollowUps = await FollowUp.countDocuments({
      branchId,
      staffId,
      followUpStatus: 'Pending',
    });

    // Notifications
    const notifications = [];

    // High due students
    const highDueStudents = await Student.countDocuments({
      branchId,
      status: 'ACTIVE',
      dueAmount: { $gt: 5000 },
    });
    if (highDueStudents > 0) {
      notifications.push({
        type: 'HIGH_DUE',
        message: `${highDueStudents} student(s) have high due amounts`,
        count: highDueStudents,
      });
    }

    // Absent students alert (consecutive days)
    const consecutiveAbsentThreshold = 3;
    const branchObjectId = new mongoose.Types.ObjectId(branchId);
    const staffObjectId = new mongoose.Types.ObjectId(staffId);
    const studentsWithConsecutiveAbsent = await Student.aggregate([
      {
        $match: {
          branchId: branchObjectId,
          status: 'ACTIVE',
        },
      },
      {
        $lookup: {
          from: 'studentattendances',
          let: { studentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$studentId', '$$studentId'] },
                    { $eq: ['$branchId', branchObjectId] },
                    { $eq: ['$status', 'Absent'] },
                    {
                      $gte: [
                        '$date',
                        new Date(Date.now() - consecutiveAbsentThreshold * 24 * 60 * 60 * 1000),
                      ],
                    },
                  ],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: consecutiveAbsentThreshold },
          ],
          as: 'recentAbsents',
        },
      },
      {
        $match: {
          'recentAbsents': { $size: consecutiveAbsentThreshold },
        },
      },
    ]);

    if (studentsWithConsecutiveAbsent.length > 0) {
      notifications.push({
        type: 'CONSECUTIVE_ABSENT',
        message: `${studentsWithConsecutiveAbsent.length} student(s) absent for ${consecutiveAbsentThreshold}+ consecutive days`,
        count: studentsWithConsecutiveAbsent.length,
      });
    }

    // Pending inquiries
    const pendingInquiries = await Inquiry.countDocuments({
      branchId,
      status: 'Pending',
    });
    if (pendingInquiries > 0) {
      notifications.push({
        type: 'PENDING_INQUIRY',
        message: `${pendingInquiries} inquiry(ies) pending follow-up`,
        count: pendingInquiries,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        selfAttendance: selfAttendanceStatus,
        todayAbsentStudentsCount,
        studentsRegisteredByStaff,
        pendingFollowUps,
        notifications,
      },
    });
  } catch (error) {
    console.error('Staff dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard summary',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getDashboardSummary,
};

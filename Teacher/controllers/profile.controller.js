const Teacher = require('../../Admin/models/teacher.model');
const Batch = require('../../Admin/models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const Branch = require('../../SuperAdmin/models/branch.model');
const { StaffAttendance } = require('../../Admin/models/attendance.model');
const Staff = require('../../Admin/models/staff.model');
const Exam = require('../../Admin/models/exam.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Teacher Profile
 * GET /api/teacher/profile
 * Comprehensive profile with all teacher information using aggregation for optimal performance
 */
const getProfile = async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const branchId = req.branchId;
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Get teacher with populated batches and branch
    const teacher = await Teacher.findById(teacherId)
      .populate('assignedBatches', 'name timeSlot courseId weekdays isActive')
      .populate('branchId', 'name code')
      .lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Get branch details
    const branch = await Branch.findById(branchId).select('name code addresses contactNumber').lean();

    // Get assigned batches with course details
    const batches = await Batch.find({
      _id: { $in: teacher.assignedBatches || [] },
      branchId,
    })
      .populate('courseId', 'name courseCategory duration')
      .lean();

    // Get assigned courses
    const assignedCourses = batches
      .map((b) => b.courseId)
      .filter((c, index, self) => c && index === self.findIndex((t) => t._id.toString() === c._id.toString()))
      .map((c) => ({
        id: c._id,
        name: c.name,
        category: c.courseCategory,
        duration: c.duration,
      }));

    // Find Staff record for attendance tracking
    let staffRecord = await Staff.findOne({
      email: teacher.email,
      branchId,
      role: 'TEACHER',
    });

    // Today's date range
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // This week's date range
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // This month's date range
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get today's attendance
    let todayAttendance = null;
    if (staffRecord) {
      const todayAtt = await StaffAttendance.findOne({
        branchId: branchObjectId,
        staffId: staffRecord._id,
        date: { $gte: todayStart, $lte: todayEnd },
      }).lean();

      if (todayAtt) {
        todayAttendance = {
          status: todayAtt.status,
          checkIn: todayAtt.checkIn,
          checkOut: todayAtt.checkOut,
          timeSlot: todayAtt.timeSlot,
          method: todayAtt.method,
          hours:
            todayAtt.checkIn && todayAtt.checkOut
              ? Math.round(((new Date(todayAtt.checkOut) - new Date(todayAtt.checkIn)) / (1000 * 60 * 60)) * 100) / 100
              : 0,
        };
      }
    }

    // Parallel aggregation queries for optimal performance
    const [
      overallAttendanceStats,
      weekAttendanceStats,
      monthAttendanceStats,
      recentAttendance,
      upcomingExams,
    ] = await Promise.all([
      // Overall attendance statistics
      staffRecord
        ? StaffAttendance.aggregate([
            {
              $match: {
                branchId: branchObjectId,
                staffId: new mongoose.Types.ObjectId(staffRecord._id),
              },
            },
            {
              $group: {
                _id: null,
                totalDays: { $sum: 1 },
                present: {
                  $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
                },
                absent: {
                  $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
                },
                late: {
                  $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
                },
                totalHours: {
                  $sum: {
                    $cond: [
                      { $and: [{ $ne: ['$checkIn', null] }, { $ne: ['$checkOut', null] }] },
                      {
                        $divide: [
                          { $subtract: ['$checkOut', '$checkIn'] },
                          3600000,
                        ],
                      },
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalDays: 1,
                present: 1,
                absent: 1,
                late: 1,
                totalHours: 1,
                percentage: {
                  $cond: [
                    { $eq: ['$totalDays', 0] },
                    0,
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$present', '$totalDays'] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                  ],
                },
              },
            },
          ])
        : Promise.resolve([]),

      // This week attendance statistics
      staffRecord
        ? StaffAttendance.aggregate([
            {
              $match: {
                branchId: branchObjectId,
                staffId: new mongoose.Types.ObjectId(staffRecord._id),
                date: { $gte: weekStart, $lte: weekEnd },
              },
            },
            {
              $group: {
                _id: null,
                totalDays: { $sum: 1 },
                present: {
                  $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
                },
                absent: {
                  $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
                },
                totalHours: {
                  $sum: {
                    $cond: [
                      { $and: [{ $ne: ['$checkIn', null] }, { $ne: ['$checkOut', null] }] },
                      {
                        $divide: [
                          { $subtract: ['$checkOut', '$checkIn'] },
                          3600000,
                        ],
                      },
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalDays: 1,
                present: 1,
                absent: 1,
                totalHours: 1,
                percentage: {
                  $cond: [
                    { $eq: ['$totalDays', 0] },
                    0,
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$present', '$totalDays'] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                  ],
                },
              },
            },
          ])
        : Promise.resolve([]),

      // This month attendance statistics
      staffRecord
        ? StaffAttendance.aggregate([
            {
              $match: {
                branchId: branchObjectId,
                staffId: new mongoose.Types.ObjectId(staffRecord._id),
                date: { $gte: monthStart, $lte: monthEnd },
              },
            },
            {
              $group: {
                _id: null,
                totalDays: { $sum: 1 },
                present: {
                  $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
                },
                absent: {
                  $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
                },
                totalHours: {
                  $sum: {
                    $cond: [
                      { $and: [{ $ne: ['$checkIn', null] }, { $ne: ['$checkOut', null] }] },
                      {
                        $divide: [
                          { $subtract: ['$checkOut', '$checkIn'] },
                          3600000,
                        ],
                      },
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalDays: 1,
                present: 1,
                absent: 1,
                totalHours: 1,
                percentage: {
                  $cond: [
                    { $eq: ['$totalDays', 0] },
                    0,
                    {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$present', '$totalDays'] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                  ],
                },
              },
            },
          ])
        : Promise.resolve([]),

      // Recent attendance (last 10 records)
      staffRecord
        ? StaffAttendance.find({
            branchId: branchObjectId,
            staffId: staffRecord._id,
          })
            .sort({ date: -1 })
            .limit(10)
            .select('date status checkIn checkOut timeSlot method')
            .lean()
        : Promise.resolve([]),

      // Upcoming exams for assigned batches
      Exam.find({
        branchId,
        batchId: { $in: teacher.assignedBatches || [] },
        examDate: { $gte: todayStart },
        status: 'ACTIVE',
      })
        .sort({ examDate: 1 })
        .limit(5)
        .populate('batchId', 'name')
        .populate('courseId', 'name')
        .select('examName examType examDate batchId courseId maxMarks passingMarks')
        .lean(),
    ]);

    const overall = overallAttendanceStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      totalHours: 0,
      percentage: 0,
    };

    const week = weekAttendanceStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      totalHours: 0,
      percentage: 0,
    };

    const month = monthAttendanceStats[0] || {
      totalDays: 0,
      present: 0,
      absent: 0,
      totalHours: 0,
      percentage: 0,
    };

    // Calculate total students in assigned batches
    const Student = require('../../Admin/models/student.model');
    const totalStudents = await Student.countDocuments({
      branchId,
      batchId: { $in: teacher.assignedBatches || [] },
      status: 'ACTIVE',
    });

    // Get salary information
    const salaryInfo = {
      salaryType: teacher.salaryType,
      salaryRate: teacher.salaryRate,
      currentMonthClasses: teacher.currentMonthClasses || 0,
      currentMonthSalary: teacher.currentMonthSalary || 0,
    };

    // Calculate estimated salary based on salary type
    if (teacher.salaryType === 'PER_CLASS') {
      salaryInfo.estimatedSalary = (teacher.currentMonthClasses || 0) * (teacher.salaryRate || 0);
    } else if (teacher.salaryType === 'MONTHLY_FIXED') {
      salaryInfo.estimatedSalary = teacher.salaryRate || 0;
    } else if (teacher.salaryType === 'HOURLY') {
      salaryInfo.estimatedSalary = (month.totalHours || 0) * (teacher.salaryRate || 0);
    }

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          _id: teacher._id,
          teacherId: teacher.teacherId,
          name: teacher.name,
          email: teacher.email,
          mobile: teacher.mobile,
          isActive: teacher.isActive,
          imageUrl: teacher.imageUrl || null,
          idCardUrl: teacher.idCardUrl || null,
          createdAt: teacher.createdAt,
        },
        branch: branch
          ? {
              _id: branch._id,
              name: branch.name,
              code: branch.code,
              contactNumber: branch.contactNumber,
              addresses: branch.addresses || [],
            }
          : null,
        assignedBatches: batches.map((batch) => ({
          _id: batch._id,
          name: batch.name,
          timeSlot: batch.timeSlot,
          weekdays: batch.weekdays || [],
          course: batch.courseId
            ? {
                id: batch.courseId._id,
                name: batch.courseId.name,
                category: batch.courseId.courseCategory,
              }
            : null,
          isActive: batch.isActive,
        })),
        assignedCourses,
        totalStudents,
        todayAttendance,
        attendance: {
          overall: {
            totalDays: overall.totalDays,
            present: overall.present,
            absent: overall.absent,
            late: overall.late,
            totalHours: Math.round(overall.totalHours * 100) / 100,
            percentage: overall.percentage,
          },
          thisWeek: {
            totalDays: week.totalDays,
            present: week.present,
            absent: week.absent,
            totalHours: Math.round(week.totalHours * 100) / 100,
            percentage: week.percentage,
          },
          thisMonth: {
            totalDays: month.totalDays,
            present: month.present,
            absent: month.absent,
            totalHours: Math.round(month.totalHours * 100) / 100,
            percentage: month.percentage,
          },
          recentAttendance: recentAttendance.map((att) => ({
            date: att.date,
            status: att.status,
            checkIn: att.checkIn,
            checkOut: att.checkOut,
            timeSlot: att.timeSlot,
            method: att.method,
            hours:
              att.checkIn && att.checkOut
                ? Math.round(((new Date(att.checkOut) - new Date(att.checkIn)) / (1000 * 60 * 60)) * 100) / 100
                : 0,
          })),
        },
        salary: salaryInfo,
        upcomingExams: upcomingExams.map((exam) => ({
          _id: exam._id,
          examName: exam.examName,
          examType: exam.examType,
          examDate: exam.examDate,
          batch: exam.batchId ? { id: exam.batchId._id, name: exam.batchId.name } : null,
          course: exam.courseId ? { id: exam.courseId._id, name: exam.courseId.name } : null,
          maxMarks: exam.maxMarks,
          passingMarks: exam.passingMarks,
        })),
      },
    });
  } catch (error) {
    console.error('Get teacher profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getProfile,
};

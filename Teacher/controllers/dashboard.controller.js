const Teacher = require('../../Admin/models/teacher.model');
const Batch = require('../../Admin/models/batch.model');
const Student = require('../../Admin/models/student.model');
const { StudentAttendance, StaffAttendance } = require('../../Admin/models/attendance.model');
const Staff = require('../../Admin/models/staff.model');
const Exam = require('../../Admin/models/exam.model');
const Branch = require('../../SuperAdmin/models/branch.model');
const Course = require('../../SuperAdmin/models/course.model');
const config = require('../config/env.config');
const mongoose = require('mongoose');

/**
 * Get Teacher Dashboard Summary
 * GET /api/teacher/dashboard/summary
 */
const getDashboardSummary = async (req, res) => {
  try {
    const teacherId = req.teacherId;
    const branchId = req.branchId;
    const assignedBatches = req.assignedBatches;

    // Get teacher details with branch info
    const teacher = await Teacher.findById(teacherId)
      .populate('assignedBatches', 'name timeSlot courseId isActive weekdays')
      .populate('branchId', 'name code');
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Get branch details
    const branch = await Branch.findById(branchId).select('name code');

    // Today's date range
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get current day name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[today.getDay()];

    // Get all batches with course details
    const batches = await Batch.find({
      _id: { $in: assignedBatches },
      branchId,
      isActive: true,
    })
      .populate('courseId', 'name courseCategory')
      .lean();

    // Today's classes (batches that have class today based on weekdays)
    const todayClasses = batches
      .filter((batch) => batch.weekdays && batch.weekdays.includes(currentDay))
      .map((batch) => ({
        batchId: batch._id,
        batchName: batch.name,
        timeSlot: batch.timeSlot,
        courseId: batch.courseId?._id,
        courseName: batch.courseId?.name,
        weekdays: batch.weekdays,
      }));

    // Get upcoming classes (next 7 days)
    const upcomingClasses = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      
      const classesForDay = batches
        .filter((batch) => batch.weekdays && batch.weekdays.includes(dayName))
        .map((batch) => ({
          date: date.toISOString().split('T')[0],
          dayName,
          batchId: batch._id,
          batchName: batch.name,
          timeSlot: batch.timeSlot,
          courseId: batch.courseId?._id,
          courseName: batch.courseId?.name,
        }));
      
      if (classesForDay.length > 0) {
        upcomingClasses.push(...classesForDay);
      }
    }

    // Get assigned courses
    const assignedCourses = batches
      .map((b) => b.courseId)
      .filter((c, index, self) => c && index === self.findIndex((t) => t._id.toString() === c._id.toString()))
      .map((c) => ({
        id: c._id,
        name: c.name,
        category: c.courseCategory,
      }));

    // Today's student attendance summary (for assigned batches)
    const todayAttendances = await StudentAttendance.find({
      branchId,
      batchId: { $in: assignedBatches },
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const todayPresent = todayAttendances.filter((a) => a.status === 'Present').length;
    const todayAbsent = todayAttendances.filter((a) => a.status === 'Absent').length;
    const todayLate = todayAttendances.filter((a) => a.status === 'Late').length;
    const todayTotal = todayAttendances.length;

    // Get total students in assigned batches
    const totalStudents = await Student.countDocuments({
      branchId,
      batchId: { $in: assignedBatches },
      status: 'ACTIVE',
    });

    // Get teacher's Staff record for attendance tracking
    let staffRecord = await Staff.findOne({
      email: teacher.email,
      branchId,
      role: 'TEACHER',
    });

    // Calculate this week's hours (from check-in/check-out)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let thisWeekHours = 0;
    let myAttendance = {
      thisWeek: {
        totalDays: 0,
        present: 0,
        absent: 0,
        totalHours: 0,
      },
      thisMonth: {
        totalDays: 0,
        present: 0,
        absent: 0,
        totalHours: 0,
      },
      attendancePercentage: 0,
    };

    if (staffRecord) {
      // Get this week's attendance
      const weekAttendance = await StaffAttendance.find({
        branchId,
        staffId: staffRecord._id,
        date: { $gte: weekStart, $lte: weekEnd },
      }).lean();

      // Calculate hours from check-in and check-out
      weekAttendance.forEach((att) => {
        if (att.checkIn && att.checkOut) {
          const hours = (new Date(att.checkOut) - new Date(att.checkIn)) / (1000 * 60 * 60);
          thisWeekHours += hours;
        }
      });

      // Get this month's attendance
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      const [weekStats, monthStats] = await Promise.all([
        // Week statistics
        StaffAttendance.aggregate([
          {
            $match: {
              branchId: new mongoose.Types.ObjectId(branchId),
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
                        3600000, // Convert milliseconds to hours
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        ]),
        // Month statistics
        StaffAttendance.aggregate([
          {
            $match: {
              branchId: new mongoose.Types.ObjectId(branchId),
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
        ]),
      ]);

      const weekData = weekStats[0] || { totalDays: 0, present: 0, absent: 0, totalHours: 0 };
      const monthData = monthStats[0] || { totalDays: 0, present: 0, absent: 0, totalHours: 0 };

      myAttendance = {
        thisWeek: {
          totalDays: weekData.totalDays,
          present: weekData.present,
          absent: weekData.absent,
          totalHours: Math.round(weekData.totalHours * 100) / 100,
        },
        thisMonth: {
          totalDays: monthData.totalDays,
          present: monthData.present,
          absent: monthData.absent,
          totalHours: Math.round(monthData.totalHours * 100) / 100,
        },
        attendancePercentage:
          weekData.totalDays > 0
            ? Math.round((weekData.present / weekData.totalDays) * 100)
            : 0,
      };
    }

    // Get attendance graph data (last 7 days)
    const graphData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      let dayAttendance = {
        date: date.toISOString().split('T')[0],
        dayName: dayNames[date.getDay()],
        present: 0,
        absent: 0,
        hours: 0,
      };

      if (staffRecord) {
        const dayAtt = await StaffAttendance.findOne({
          branchId,
          staffId: staffRecord._id,
          date: { $gte: dateStart, $lte: dateEnd },
        }).lean();

        if (dayAtt) {
          dayAttendance.present = dayAtt.status === 'Present' ? 1 : 0;
          dayAttendance.absent = dayAtt.status === 'Absent' ? 1 : 0;
          if (dayAtt.checkIn && dayAtt.checkOut) {
            const hours = (new Date(dayAtt.checkOut) - new Date(dayAtt.checkIn)) / (1000 * 60 * 60);
            dayAttendance.hours = Math.round(hours * 100) / 100;
          }
        }
      }

      graphData.push(dayAttendance);
    }

    // Notifications
    const notifications = [];

    // Today's class reminder
    if (todayClasses.length > 0) {
      notifications.push({
        type: 'CLASS_REMINDER',
        message: `You have ${todayClasses.length} class(es) today`,
        batches: todayClasses.map((c) => c.batchName),
        priority: 'MEDIUM',
      });
    }

    // Upcoming exams
    const upcomingExams = await Exam.find({
      branchId,
      batchId: { $in: assignedBatches },
      examDate: { $gte: todayStart },
      status: 'ACTIVE',
    })
      .sort({ examDate: 1 })
      .limit(3)
      .select('examName examType examDate batchId');

    if (upcomingExams.length > 0) {
      notifications.push({
        type: 'UPCOMING_EXAM',
        message: `${upcomingExams.length} upcoming exam(s) for your batches`,
        exams: upcomingExams.map((e) => ({
          name: e.examName,
          type: e.examType,
          date: e.examDate,
        })),
        priority: 'HIGH',
      });
    }

    // Content upload reminder (if any recorded classes pending)
    const RecordedClass = require('../../Admin/models/recordedClass.model');
    const pendingContent = await RecordedClass.countDocuments({
      branchId,
      batchId: { $in: assignedBatches },
      isActive: true,
    });

    if (pendingContent === 0) {
      notifications.push({
        type: 'CONTENT_REMINDER',
        message: 'Consider uploading study materials for your batches',
        priority: 'LOW',
      });
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
        },
        branch: branch
          ? {
              _id: branch._id,
              name: branch.name,
              code: branch.code,
            }
          : null,
        todayClasses,
        upcomingClasses: upcomingClasses.slice(0, 10), // Limit to next 10 classes
        assignedCourses,
        assignedBatches: batches.map((b) => ({
          id: b._id,
          name: b.name,
          timeSlot: b.timeSlot,
          weekdays: b.weekdays,
        })),
        todayAttendance: {
          total: todayTotal,
          present: todayPresent,
          absent: todayAbsent,
          late: todayLate,
          totalStudents,
          attendancePercentage: totalStudents === 0 ? 0 : Math.round((todayPresent / totalStudents) * 100),
        },
        myAttendance,
        thisWeekHours: Math.round(thisWeekHours * 100) / 100,
        graphData,
        notifications,
      },
    });
  } catch (error) {
    console.error('Teacher dashboard summary error:', error);
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

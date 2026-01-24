const Teacher = require('../../Admin/models/teacher.model');
const Batch = require('../../Admin/models/batch.model');
const Student = require('../../Admin/models/student.model');
const { StudentAttendance } = require('../../Admin/models/attendance.model');
const Exam = require('../../Admin/models/exam.model');
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

    // Get teacher details
    const teacher = await Teacher.findById(teacherId).populate('assignedBatches', 'name timeSlot courseId isActive');
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's classes (assigned batches)
    const todayClasses = teacher.assignedBatches
      .filter((batch) => batch.isActive)
      .map((batch) => ({
        batchId: batch._id,
        batchName: batch.name,
        timeSlot: batch.timeSlot,
        courseId: batch.courseId,
      }));

    // Get assigned courses
    const assignedCourses = await Batch.find({
      _id: { $in: assignedBatches },
      branchId,
    })
      .populate('courseId', 'name courseCategory')
      .distinct('courseId');

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
        todayClasses,
        assignedCourses: assignedCourses.map((c) => ({
          id: c._id,
          name: c.name,
          category: c.courseCategory,
        })),
        assignedBatches: teacher.assignedBatches.map((b) => ({
          id: b._id,
          name: b.name,
          timeSlot: b.timeSlot,
        })),
        todayAttendance: {
          total: todayTotal,
          present: todayPresent,
          absent: todayAbsent,
          late: todayLate,
          totalStudents,
          attendancePercentage: totalStudents === 0 ? 0 : Math.round((todayPresent / totalStudents) * 100),
        },
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

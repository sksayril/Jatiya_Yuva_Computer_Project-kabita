const Exam = require('../../Admin/models/exam.model');
const Batch = require('../../Admin/models/batch.model');
const RecordedClass = require('../../Admin/models/recordedClass.model');
const config = require('../config/env.config');

/**
 * Get Notifications & Alerts
 * GET /api/teacher/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const branchId = req.branchId;
    const assignedBatches = req.assignedBatches;

    const notifications = [];

    // Today's class reminder
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const batches = await Batch.find({
      _id: { $in: assignedBatches },
      branchId,
      isActive: true,
    }).select('name timeSlot');

    if (batches.length > 0) {
      notifications.push({
        type: 'CLASS_REMINDER',
        message: `You have ${batches.length} class(es) today`,
        batches: batches.map((b) => ({ name: b.name, timeSlot: b.timeSlot })),
        priority: 'MEDIUM',
        timestamp: new Date(),
      });
    }

    // Exam duty alert
    const upcomingExams = await Exam.find({
      branchId,
      batchId: { $in: assignedBatches },
      examDate: { $gte: today, $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) }, // Next 7 days
      status: 'ACTIVE',
    })
      .populate('batchId', 'name timeSlot')
      .sort({ examDate: 1 })
      .limit(5);

    if (upcomingExams.length > 0) {
      notifications.push({
        type: 'EXAM_DUTY_ALERT',
        message: `${upcomingExams.length} exam(s) scheduled in next 7 days`,
        exams: upcomingExams.map((e) => ({
          id: e._id,
          name: e.name,
          type: e.examType,
          date: e.examDate,
          batch: e.batchId?.name,
        })),
        priority: 'HIGH',
        timestamp: new Date(),
      });
    }

    // Assignment / content pending alert
    const pendingMarks = await Exam.find({
      branchId,
      batchId: { $in: assignedBatches },
      examDate: { $lt: today },
      status: 'ACTIVE',
    });

    const Result = require('../../Admin/models/result.model');
    const pendingMarksCount = await Promise.all(
      pendingMarks.map(async (exam) => {
        const Student = require('../../Admin/models/student.model');
        const totalStudents = await Student.countDocuments({
          branchId,
          batchId: exam.batchId,
          status: 'ACTIVE',
        });
        const resultsCount = await Result.countDocuments({
          branchId,
          examId: exam._id,
        });
        return {
          examId: exam._id,
          examName: exam.name,
          pending: totalStudents - resultsCount,
        };
      })
    );

    const totalPending = pendingMarksCount.reduce((sum, p) => sum + p.pending, 0);
    if (totalPending > 0) {
      notifications.push({
        type: 'MARKS_PENDING',
        message: `Marks pending for ${totalPending} student(s) in past exams`,
        pendingMarks: pendingMarksCount.filter((p) => p.pending > 0),
        priority: 'HIGH',
        timestamp: new Date(),
      });
    }

    // Content upload reminder
    const recentContent = await RecordedClass.countDocuments({
      branchId,
      batchId: { $in: assignedBatches },
      uploadedBy: req.teacherId,
      createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    if (recentContent === 0) {
      notifications.push({
        type: 'CONTENT_REMINDER',
        message: 'Consider uploading study materials for your batches',
        priority: 'LOW',
        timestamp: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        notifications,
        summary: {
          total: notifications.length,
          highPriority: notifications.filter((n) => n.priority === 'HIGH').length,
          mediumPriority: notifications.filter((n) => n.priority === 'MEDIUM').length,
          lowPriority: notifications.filter((n) => n.priority === 'LOW').length,
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getNotifications,
};

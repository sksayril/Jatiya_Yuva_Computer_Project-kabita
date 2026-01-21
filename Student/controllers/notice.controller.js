const Notice = require('../models/notice.model');
const Student = require('../../Admin/models/student.model');
const config = require('../config/env.config');

/**
 * Get Notices & Announcements
 * GET /api/student/notices
 */
const getNotices = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { noticeType, page = 1, limit = 20 } = req.query;

    const student = await Student.findById(studentId).select('courseId batchId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Build query
    const query = {
      branchId,
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { targetAudience: 'ALL' },
        { targetAudience: 'STUDENT', targetStudentIds: studentId },
        { targetAudience: 'BATCH', targetBatchIds: student.batchId },
        { targetAudience: 'COURSE', targetCourseIds: student.courseId },
      ],
    };

    // Filter by end date
    query.$or.push({ endDate: { $gte: new Date() } });
    query.$or.push({ endDate: { $exists: false } });

    if (noticeType) {
      query.noticeType = noticeType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notices, total] = await Promise.all([
      Notice.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-targetStudentIds -targetBatchIds -targetCourseIds'), // Don't expose target lists
      Notice.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notices',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getNotices,
};

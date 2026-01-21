const Student = require('../../Admin/models/student.model');
const RecordedClass = require('../../Admin/models/recordedClass.model');
const config = require('../config/env.config');

/**
 * Get Live Classes (Placeholder)
 * GET /api/student/classes/live
 */
const getLiveClasses = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;

    const student = await Student.findById(studentId).select('batchId courseId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Placeholder for live class integration
    // In production, integrate with live streaming service
    res.status(200).json({
      success: true,
      message: 'Live classes (placeholder)',
      data: {
        liveClasses: [],
        note: 'Live class integration will be implemented. Students can access live classes for their assigned batch.',
        batchId: student.batchId,
        courseId: student.courseId,
      },
    });
  } catch (error) {
    console.error('Get live classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching live classes',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Recorded Classes
 * GET /api/student/classes/recorded
 */
const getRecordedClasses = async (req, res) => {
  try {
    const studentId = req.studentId;
    const branchId = req.branchId;
    const { page = 1, limit = 20 } = req.query;

    const student = await Student.findById(studentId).select('batchId courseId');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Build query - student can only access their batch content
    const query = {
      branchId,
      batchId: student.batchId,
      isActive: true,
      $or: [
        { accessControl: { $exists: false } }, // No access control = all students in batch
        { 'accessControl.allowedStudents': studentId }, // Explicitly allowed
        { 'accessControl.allowedBatches': student.batchId }, // Batch allowed
      ],
    };

    // Filter expired classes
    const now = new Date();
    query.$or.push({ expiryDate: { $gte: now } });
    query.$or.push({ expiryDate: { $exists: false } });

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [classes, total] = await Promise.all([
      RecordedClass.find(query)
        .populate('courseId', 'name')
        .populate('batchId', 'name timeSlot')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-accessControl'), // Don't expose access control details
      RecordedClass.countDocuments(query),
    ]);

    // Remove download URLs - only streaming links
    const sanitizedClasses = classes.map((cls) => ({
      _id: cls._id,
      title: cls.title,
      description: cls.description,
      videoUrl: cls.videoUrl, // Streaming link (not download)
      thumbnailUrl: cls.thumbnailUrl,
      duration: cls.duration,
      expiryDate: cls.expiryDate,
      course: cls.courseId,
      batch: cls.batchId,
      createdAt: cls.createdAt,
      note: 'Download is disabled. Video is for streaming only.',
    }));

    res.status(200).json({
      success: true,
      data: {
        classes: sanitizedClasses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get recorded classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recorded classes',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  getLiveClasses,
  getRecordedClasses,
};

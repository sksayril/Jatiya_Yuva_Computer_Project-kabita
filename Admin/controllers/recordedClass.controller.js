const RecordedClass = require('../models/recordedClass.model');
const Batch = require('../models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Recorded Class
 * POST /api/admin/recorded-classes
 */
const createRecordedClass = async (req, res) => {
  try {
    const branchId = req.branchId;
    const {
      batchId,
      courseId,
      title,
      description,
      duration,
      expiryDate,
      allowedStudents,
      allowDownload,
    } = req.body;

    if (!batchId || !courseId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: batchId, courseId, title',
      });
    }

    // Verify batch and course belong to branch
    const [batch, course] = await Promise.all([
      Batch.findOne({ _id: batchId, branchId }),
      Course.findById(courseId),
    ]);

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Handle file uploads
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required',
      });
    }

    const videoUrl = videoFile.location || videoFile.path;
    const thumbnailUrl = thumbnailFile ? (thumbnailFile.location || thumbnailFile.path) : '';

    // Create recorded class
    const recordedClass = await RecordedClass.create({
      branchId,
      batchId,
      courseId,
      title: title.trim(),
      description: description?.trim(),
      videoUrl,
      thumbnailUrl,
      duration: duration || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      accessControl: {
        allowedStudents: allowedStudents || [],
        allowDownload: allowDownload || false,
      },
      uploadedBy: req.user.id,
      isActive: true,
    });

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'RECORDED_CLASS',
      entityId: recordedClass._id,
      newData: { title, batchId, courseId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Recorded class created successfully',
      data: recordedClass,
    });
  } catch (error) {
    console.error('Create recorded class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating recorded class',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Recorded Classes
 * GET /api/admin/recorded-classes
 */
const getRecordedClasses = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { batchId, courseId, isActive } = req.query;

    const query = { branchId };
    if (batchId) query.batchId = batchId;
    if (courseId) query.courseId = courseId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const recordedClasses = await RecordedClass.find(query)
      .populate('batchId', 'name timeSlot')
      .populate('courseId', 'name courseCategory')
      .populate('accessControl.allowedStudents', 'studentId name')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: recordedClasses,
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
  createRecordedClass,
  getRecordedClasses,
};

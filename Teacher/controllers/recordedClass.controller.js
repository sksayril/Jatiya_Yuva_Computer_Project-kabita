const RecordedClass = require('../../Admin/models/recordedClass.model');
const Batch = require('../../Admin/models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const { logAudit } = require('../utils/auditLogger');
const { verifyBatchAssignment } = require('../middlewares/batchIsolation.middleware');
const config = require('../config/env.config');

/**
 * Create Recorded Class & Study Material
 * POST /api/teacher/recorded-classes
 * Teachers can upload for their assigned batches only
 */
const createRecordedClass = async (req, res) => {
  try {
    const branchId = req.branchId;
    const teacherId = req.teacherId;
    const assignedBatches = req.assignedBatches;
    const {
      batchId,
      courseId,
      title,
      description,
      duration,
      expiryDate,
    } = req.body;

    if (!batchId || !courseId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: batchId, courseId, title',
      });
    }

    // Verify batch is assigned to teacher
    try {
      verifyBatchAssignment(batchId, assignedBatches);
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    // Verify batch and course belong to branch
    const [batch, course] = await Promise.all([
      Batch.findOne({ _id: batchId, branchId }),
      Course.findById(courseId),
    ]);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Handle file uploads (video, PDF/notes)
    const videoFile = req.files?.video?.[0];
    const pdfFile = req.files?.pdf?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile && !pdfFile) {
      return res.status(400).json({
        success: false,
        message: 'Either video file or PDF file is required',
      });
    }

    // Use videoUrl for video, or store PDF URL in videoUrl if only PDF is provided
    const videoUrl = videoFile 
      ? (videoFile.location || videoFile.path) 
      : (pdfFile ? (pdfFile.location || pdfFile.path) : '');
    const thumbnailUrl = thumbnailFile ? (thumbnailFile.location || thumbnailFile.path) : '';
    
    // Store PDF URL in description if provided (for reference)
    const finalDescription = pdfFile && !videoFile
      ? `${description || ''}\n[PDF Material: ${pdfFile.location || pdfFile.path}]`.trim()
      : description?.trim();

    // Create recorded class
    const recordedClass = await RecordedClass.create({
      branchId,
      batchId,
      courseId,
      title: title.trim(),
      description: finalDescription,
      videoUrl: videoUrl || (pdfFile ? pdfFile.location || pdfFile.path : ''), // Required field
      thumbnailUrl,
      duration: duration || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      accessControl: {
        allowedStudents: [], // All students in batch can access
        allowDownload: false, // Download disabled for students
      },
      uploadedBy: teacherId,
      isActive: true,
    });

    await logAudit({
      branchId,
      userId: teacherId,
      role: 'TEACHER',
      action: 'UPLOAD_RECORDED_CLASS',
      module: 'RECORDED_CLASS',
      entityId: recordedClass._id.toString(),
      newData: { title, batchId, courseId, contentType: videoFile ? 'video' : 'pdf' },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Recorded class/study material uploaded successfully',
      data: {
        ...recordedClass.toObject(),
        note: 'Students can view/stream but cannot download. Download is disabled.',
      },
    });
  } catch (error) {
    console.error('Create recorded class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading recorded class',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Recorded Classes (by teacher)
 * GET /api/teacher/recorded-classes
 */
const getRecordedClasses = async (req, res) => {
  try {
    const branchId = req.branchId;
    const teacherId = req.teacherId;
    const assignedBatches = req.assignedBatches;
    const { batchId, page = 1, limit = 20 } = req.query;

    const query = {
      branchId,
      uploadedBy: teacherId,
      isActive: true,
    };

    if (batchId) {
      // Verify batch is assigned
      try {
        verifyBatchAssignment(batchId, assignedBatches);
        query.batchId = batchId;
      } catch (error) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
    } else {
      // Only show classes for assigned batches
      query.batchId = { $in: assignedBatches };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [classes, total] = await Promise.all([
      RecordedClass.find(query)
        .populate('batchId', 'name timeSlot')
        .populate('courseId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RecordedClass.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        classes,
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
  createRecordedClass,
  getRecordedClasses,
};

const Notice = require('../../Student/models/notice.model');
const Batch = require('../../Admin/models/batch.model');
const { logAudit } = require('../utils/auditLogger');
const { verifyBatchAssignment } = require('../middlewares/batchIsolation.middleware');
const config = require('../config/env.config');

/**
 * Create Batch Notice
 * POST /api/teacher/notices
 * Teachers can create notices for their assigned batches only
 */
const createNotice = async (req, res) => {
  try {
    const branchId = req.branchId;
    const teacherId = req.teacherId;
    const assignedBatches = req.assignedBatches;
    const {
      title,
      content,
      noticeType = 'CLASS',
      batchId,
      priority = 'MEDIUM',
      startDate,
      endDate,
    } = req.body;

    if (!title || !content || !batchId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, content, batchId',
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

    // Verify batch belongs to branch
    const batch = await Batch.findOne({ _id: batchId, branchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found',
      });
    }

    // Create notice
    const notice = await Notice.create({
      branchId,
      title: title.trim(),
      content: content.trim(),
      noticeType: noticeType.toUpperCase(),
      targetAudience: 'BATCH',
      targetBatchIds: [batchId],
      priority: priority.toUpperCase(),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      isActive: true,
      createdBy: 'TEACHER',
    });

    await logAudit({
      branchId,
      userId: teacherId,
      role: 'TEACHER',
      action: 'CREATE_NOTICE',
      module: 'NOTICE',
      entityId: notice._id.toString(),
      newData: { title, noticeType, batchId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: notice,
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notice',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Notices (by teacher)
 * GET /api/teacher/notices
 */
const getNotices = async (req, res) => {
  try {
    const branchId = req.branchId;
    const assignedBatches = req.assignedBatches;
    const { batchId, noticeType, page = 1, limit = 20 } = req.query;

    const query = {
      branchId,
      isActive: true,
      targetAudience: 'BATCH',
      targetBatchIds: { $in: assignedBatches },
    };

    if (batchId) {
      try {
        verifyBatchAssignment(batchId, assignedBatches);
        query.targetBatchIds = batchId;
      } catch (error) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }
    }

    if (noticeType) {
      query.noticeType = noticeType.toUpperCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate('targetBatchIds', 'name timeSlot')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
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
  createNotice,
  getNotices,
};

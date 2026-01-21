const Batch = require('../models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const Staff = require('../models/staff.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Batch
 * POST /api/admin/batches
 */
const createBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { name, timeSlot, monthlyFee, isKidsBatch, discountPercentage, teacherId, courseId, maxStudents } = req.body;

    if (!name || !timeSlot || monthlyFee === undefined || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, timeSlot, monthlyFee, courseId',
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Verify teacher if provided
    if (teacherId) {
      const teacher = await Staff.findOne({ _id: teacherId, branchId, role: 'TEACHER' });
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
    }

    // For kids batch, discount is locked (read-only)
    let finalDiscountPercentage = 0;
    if (isKidsBatch) {
      finalDiscountPercentage = discountPercentage || 10; // Default 10% for kids
    } else {
      finalDiscountPercentage = discountPercentage || 0;
    }

    // Create batch
    const batch = await Batch.create({
      branchId,
      name: name.trim(),
      timeSlot: timeSlot.trim(),
      monthlyFee: Number(monthlyFee),
      isKidsBatch: isKidsBatch || false,
      discountPercentage: finalDiscountPercentage,
      teacherId: teacherId || null,
      courseId,
      maxStudents: maxStudents || 30,
      currentStudents: 0,
      isActive: true,
    });

    // Update teacher's assigned batches if teacher provided
    if (teacherId) {
      await Staff.findByIdAndUpdate(teacherId, {
        $addToSet: { assignedBatches: batch._id },
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'BATCH',
      entityId: batch._id,
      newData: { name, timeSlot, isKidsBatch },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch,
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Batches
 * GET /api/admin/batches
 */
const getBatches = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { courseId, isActive, isKidsBatch } = req.query;

    const query = { branchId };
    if (courseId) query.courseId = courseId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isKidsBatch !== undefined) query.isKidsBatch = isKidsBatch === 'true';

    const batches = await Batch.find(query)
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batches',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Batch
 * PATCH /api/admin/batches/:id
 */
const updateBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const update = {};

    const allowedFields = ['name', 'timeSlot', 'monthlyFee', 'teacherId', 'maxStudents', 'isActive'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    // Kids batch discount is read-only, don't allow changes
    if (req.body.discountPercentage !== undefined) {
      const batch = await Batch.findOne({ _id: id, branchId });
      if (batch && batch.isKidsBatch) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage is locked for kids batches',
        });
      }
      update.discountPercentage = req.body.discountPercentage;
    }

    const batch = await Batch.findOneAndUpdate(
      { _id: id, branchId },
      update,
      { new: true }
    );

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'BATCH',
      entityId: batch._id,
      newData: update,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: batch,
    });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createBatch,
  getBatches,
  updateBatch,
};

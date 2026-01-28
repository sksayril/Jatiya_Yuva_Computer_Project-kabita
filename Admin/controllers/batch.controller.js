const Batch = require('../models/batch.model');
const Course = require('../../SuperAdmin/models/course.model');
const Staff = require('../models/staff.model');
const Teacher = require('../models/teacher.model');
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
      const teacher = await Teacher.findOne({ _id: teacherId, branchId });
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
      await Teacher.findByIdAndUpdate(teacherId, {
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

    // Populate batch details for response
    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: populatedBatch,
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
 * Get Batch by ID
 * GET /api/admin/batches/:id
 */
const getBatchById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const batch = await Batch.findOne({ _id: id, branchId })
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error('Get batch by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batch',
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

    // Verify teacher if provided
    if (req.body.teacherId) {
      const teacher = await Teacher.findOne({ _id: req.body.teacherId, branchId });
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
    }

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

    // Populate batch details for response
    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: populatedBatch,
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

/**
 * Delete Batch
 * POST /api/admin/batches/:id/delete
 */
const deleteBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Find and verify batch belongs to admin's branch
    const batch = await Batch.findOne({ _id: id, branchId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Check if batch has students
    const studentCount = batch.currentStudents || 0;
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete batch with active students. Current students: ${studentCount}`,
      });
    }

    // Store old data for audit log
    const oldData = {
      name: batch.name,
      timeSlot: batch.timeSlot,
      monthlyFee: batch.monthlyFee,
      teacherId: batch.teacherId,
      courseId: batch.courseId,
      maxStudents: batch.maxStudents,
    };

    // Delete batch
    await Batch.findByIdAndDelete(id);

    // Log audit
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'BATCH',
      entityId: id,
      oldData,
      newData: null,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Assign Teacher to Batch
 * POST /api/admin/batches/:id/assign-teacher
 */
const assignTeacherToBatch = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { teacherId, course } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: teacherId',
      });
    }

    // Verify batch exists
    const batch = await Batch.findOne({ _id: id, branchId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Verify course matches batch course if course supplied
    if (course) {
      if (batch.courseId.toString() !== course) {
        return res.status(400).json({
          success: false,
          message: 'Course ID does not match batch course',
        });
      }
    }

    // Verify teacher exists and belongs to same branch
    const teacher = await Teacher.findOne({ _id: teacherId, branchId });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    // Store old teacher ID for audit log
    const oldTeacherId = batch.teacherId;

    // Remove batch from old teacher's assigned batches if exists
    if (oldTeacherId) {
      await Teacher.findByIdAndUpdate(oldTeacherId, {
        $pull: { assignedBatches: batch._id },
      });
    }

    // Update batch with new teacher
    batch.teacherId = teacherId;
    await batch.save();

    // Add batch to new teacher's assigned batches
    await Teacher.findByIdAndUpdate(teacherId, {
      $addToSet: { assignedBatches: batch._id },
    });

    // Log audit
    const newData = { teacherId };
    if (course) newData.course = course;
    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'ASSIGN',
      module: 'BATCH',
      entityId: batch._id,
      oldData: { teacherId: oldTeacherId },
      newData,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Populate batch details for response
    const populatedBatch = await Batch.findById(batch._id)
      .populate('courseId', 'name courseCategory')
      .populate('teacherId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Teacher assigned to batch successfully',
      data: populatedBatch,
    });
  } catch (error) {
    console.error('Assign teacher to batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning teacher to batch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  assignTeacherToBatch,
};

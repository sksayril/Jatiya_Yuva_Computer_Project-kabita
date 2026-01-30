const Inquiry = require('../models/inquiry.model');
const Student = require('../models/student.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Inquiry
 * POST /api/admin/inquiries
 */
const createInquiry = async (req, res) => {
  try {
    const branchId = req.branchId;
    const {
      name,
      mobile,
      email,
      address,
      courseInterest,
      source,
      notes,
    } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, mobile',
      });
    }

    // Create inquiry
    const inquiry = await Inquiry.create({
      branchId,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email?.toLowerCase().trim(),
      address: address?.trim(),
      courseInterest: courseInterest?.trim(),
      source: source?.trim(),
      status: 'NEW',
      notes: notes?.trim(),
      handledBy: req.user.id,
    });

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE',
      module: 'INQUIRY',
      entityId: inquiry._id,
      newData: { name, mobile, status: 'NEW' },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry created successfully',
      data: inquiry,
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating inquiry',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Inquiries
 * GET /api/admin/inquiries
 */
const getInquiries = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { status, source } = req.query;

    const query = { branchId };
    if (status) query.status = status;
    if (source) query.source = source;

    // PERFORMANCE OPTIMIZATIONS:
    // 1. .lean() - Returns plain JS objects instead of heavy Mongoose documents (HUGE speed boost)
    // 2. .select() - Only fetch fields we actually need
    // 3. Selective populate - Only fetch minimal fields from related models
    const inquiries = await Inquiry.find(query)
      .populate({
        path: 'convertedToStudentId',
        select: 'studentId name studentName'
      })
      .populate({
        path: 'handledBy',
        select: 'name email'
      })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean(); // Bypasses Mongoose middleware/change tracking for 3-5x faster reads

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inquiries',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Convert Inquiry to Student
 * PATCH /api/admin/inquiries/:id/convert
 */
const convertInquiry = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required',
      });
    }

    // Verify inquiry belongs to branch
    const inquiry = await Inquiry.findOne({ _id: id, branchId });
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // Verify student belongs to branch
    const student = await Student.findOne({ _id: studentId, branchId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Update inquiry
    const oldData = { status: inquiry.status, convertedToStudentId: inquiry.convertedToStudentId };
    inquiry.status = 'CONVERTED';
    inquiry.convertedToStudentId = studentId;
    await inquiry.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'CONVERT',
      module: 'INQUIRY',
      entityId: inquiry._id,
      oldData,
      newData: { status: 'CONVERTED', convertedToStudentId: studentId },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Inquiry converted to student successfully',
      data: inquiry,
    });
  } catch (error) {
    console.error('Convert inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while converting inquiry',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Get Inquiry by ID
 * GET /api/admin/inquiries/:id
 */
const getInquiryById = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    // Use findById for faster O(1) lookup by primary key
    const inquiry = await Inquiry.findById(id)
      .populate({
        path: 'convertedToStudentId',
        select: 'studentId studentName name mobile'
      })
      .populate({
        path: 'handledBy',
        select: 'name'
      })
      .select('-__v -updatedAt') // Exclude metadata not needed for display
      .lean();

    // Verify existence AND branch isolation (security)
    if (!inquiry || inquiry.branchId.toString() !== branchId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error('Get inquiry by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inquiry',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Update Inquiry
 * POST /api/admin/inquiries/:id/update
 */
const updateInquiry = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;
    const updateData = req.body;

    // Prevent direct modification of restricted fields via this endpoint
    delete updateData.branchId;
    delete updateData.convertedToStudentId;
    delete updateData.handledBy;

    const inquiry = await Inquiry.findOne({ _id: id, branchId });
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    const oldData = { ...inquiry.toObject() };
    delete oldData.__v;

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        inquiry[key] = typeof updateData[key] === 'string' ? updateData[key].trim() : updateData[key];
      }
    });

    const updatedInquiry = await inquiry.save();

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE',
      module: 'INQUIRY',
      entityId: id,
      oldData,
      newData: updateData,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Inquiry updated successfully',
      data: updatedInquiry,
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating inquiry',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

/**
 * Delete Inquiry
 * POST /api/admin/inquiries/:id/delete
 */
const deleteInquiry = async (req, res) => {
  try {
    const branchId = req.branchId;
    const { id } = req.params;

    const inquiry = await Inquiry.findOneAndDelete({ _id: id, branchId });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found',
      });
    }

    await logAudit({
      branchId,
      userId: req.user.id,
      role: req.user.role,
      action: 'DELETE',
      module: 'INQUIRY',
      entityId: id,
      oldData: { name: inquiry.name, mobile: inquiry.mobile },
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Inquiry deleted successfully',
    });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting inquiry',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  convertInquiry,
};

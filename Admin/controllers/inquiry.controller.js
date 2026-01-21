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

    const inquiries = await Inquiry.find(query)
      .populate('convertedToStudentId', 'studentId name')
      .populate('handledBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
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

module.exports = {
  createInquiry,
  getInquiries,
  convertInquiry,
};

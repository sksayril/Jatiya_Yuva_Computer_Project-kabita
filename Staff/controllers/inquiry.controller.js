const Inquiry = require('../../Admin/models/inquiry.model');
const { logAudit } = require('../utils/auditLogger');
const config = require('../config/env.config');

/**
 * Create Inquiry
 * POST /api/staff/inquiries
 */
const createInquiry = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
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
      handledBy: staffId,
    });

    await logAudit({
      branchId,
      userId: staffId,
      role: 'STAFF',
      action: 'CREATE_INQUIRY',
      module: 'INQUIRY',
      entityId: inquiry._id.toString(),
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
 * GET /api/staff/inquiries
 */
const getInquiries = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { branchId, handledBy: staffId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [inquiries, total] = await Promise.all([
      Inquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Inquiry.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        inquiries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
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
 * Update Inquiry Follow-up
 * PATCH /api/staff/inquiries/:id/follow-up
 */
const updateInquiryFollowUp = async (req, res) => {
  try {
    const branchId = req.branchId;
    const staffId = req.user.id;
    const { id } = req.params;
    const { followUpNotes, status, nextFollowUpDate } = req.body;

    // Find inquiry
    const inquiry = await Inquiry.findOne({
      _id: id,
      branchId,
      handledBy: staffId, // Staff can only update their own inquiries
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found or access denied',
      });
    }

    // Update follow-up
    const oldData = { ...inquiry.toObject() };
    if (followUpNotes !== undefined) {
      inquiry.followUpNotes = (inquiry.followUpNotes || '') + '\n' + followUpNotes?.trim();
    }
    if (status) inquiry.status = status;
    if (nextFollowUpDate) inquiry.nextFollowUpDate = new Date(nextFollowUpDate);

    await inquiry.save();

    await logAudit({
      branchId,
      userId: staffId,
      role: 'STAFF',
      action: 'UPDATE_INQUIRY_FOLLOW_UP',
      module: 'INQUIRY',
      entityId: inquiry._id.toString(),
      oldData,
      newData: inquiry.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Inquiry follow-up updated successfully',
      data: inquiry,
    });
  } catch (error) {
    console.error('Update inquiry follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating inquiry follow-up',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  updateInquiryFollowUp,
};

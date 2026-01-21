const Branch = require('../models/branch.model');
const config = require('../config/env.config');
const { logAudit } = require('../utils/auditLogger');

const createBranch = async (req, res) => {
  try {
    const { name, code, addresses, contactNumber } = req.body;
    if (!name || !code || !addresses || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, code, addresses, contactNumber',
      });
    }
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Addresses must be a non-empty array',
      });
    }

    const existing = await Branch.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Branch code already exists',
      });
    }

    const branch = await Branch.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      addresses,
      contactNumber: contactNumber.trim(),
    });

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'CREATE',
      module: 'BRANCH',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating branch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching branches',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    ['name', 'code', 'contactNumber', 'status'].forEach((field) => {
      if (req.body[field]) {
        update[field] = field === 'code' ? req.body[field].toUpperCase().trim() : req.body[field].trim();
      }
    });
    if (req.body.addresses) {
      if (!Array.isArray(req.body.addresses) || req.body.addresses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Addresses must be a non-empty array',
        });
      }
      update.addresses = req.body.addresses;
    }

    const branch = await Branch.findOneAndUpdate(
      { _id: id, isDeleted: false },
      update,
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'UPDATE',
      module: 'BRANCH',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating branch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const lockBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status: 'LOCKED' },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'LOCK',
      module: 'BRANCH',
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Branch locked successfully',
      data: branch,
    });
  } catch (error) {
    console.error('Lock branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while locking branch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const unlockBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { status: 'ACTIVE' },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'UNLOCK',
      module: 'BRANCH',
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Branch unlocked successfully',
      data: branch,
    });
  } catch (error) {
    console.error('Unlock branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unlocking branch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const softDeleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!branch) {
      return res.status(404).json({ 
        success: false, 
        message: 'Branch not found or already deleted' 
      });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'SOFT_DELETE',
      module: 'BRANCH',
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Branch soft deleted successfully',
      data: {
        _id: branch._id,
        name: branch.name,
        code: branch.code,
        isDeleted: branch.isDeleted,
      },
    });
  } catch (error) {
    console.error('Soft delete branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while soft deleting branch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'DELETE',
      module: 'BRANCH',
      ip: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Branch deleted permanently',
    });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting branch',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createBranch,
  getBranches,
  updateBranch,
  lockBranch,
  unlockBranch,
  softDeleteBranch,
  deleteBranch,
};


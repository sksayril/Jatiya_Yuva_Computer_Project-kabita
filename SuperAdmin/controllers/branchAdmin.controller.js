const Branch = require('../models/branch.model');
const User = require('../models/user.model');
const config = require('../config/env.config');
const { logAudit } = require('../utils/auditLogger');

const createBranchAdmin = async (req, res) => {
  try {
    const { name, email, password, branchId } = req.body;
    if (!name || !email || !password || !branchId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, password, branchId',
      });
    }

    const branch = await Branch.findOne({ _id: branchId, isDeleted: false });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const admin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'ADMIN',
      branchId,
      isActive: true,
    });

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'CREATE',
      module: 'BRANCH_ADMIN',
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: admin });
  } catch (error) {
    console.error('Create branch admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating branch admin',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const blockBranchAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findOneAndUpdate(
      { _id: id, role: 'ADMIN' },
      { isActive: false },
      { new: true }
    );
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'BLOCK',
      module: 'BRANCH_ADMIN',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    console.error('Block branch admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while blocking admin',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const unblockBranchAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findOneAndUpdate(
      { _id: id, role: 'ADMIN' },
      { isActive: true },
      { new: true }
    );
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'UNBLOCK',
      module: 'BRANCH_ADMIN',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    console.error('Unblock branch admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unblocking admin',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const resetBranchAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const admin = await User.findOneAndUpdate(
      { _id: id, role: 'ADMIN' },
      { password: password },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'RESET_PASSWORD',
      module: 'BRANCH_ADMIN',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const getBranchAdmins = async (req, res) => {
  try {
    const { branchId } = req.query;
    
    // If branchId is provided, filter by branch
    const query = { role: 'ADMIN' };
    if (branchId) {
      query.branchId = branchId;
    }
    
    const admins = await User.find(query)
      .populate('branchId', 'name code')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    console.error('Get branch admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching branch admins',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const updateBranchAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    ['name', 'email', 'branchId', 'isActive'].forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'email') {
          update[field] = req.body[field].toLowerCase().trim();
        } else if (field === 'name') {
          update[field] = req.body[field].trim();
        } else {
          update[field] = req.body[field];
        }
      }
    });

    const admin = await User.findOneAndUpdate(
      { _id: id, role: 'ADMIN' },
      update,
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'UPDATE',
      module: 'BRANCH_ADMIN',
      ip: req.ip,
    });

    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    console.error('Update branch admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating branch admin',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

const deleteBranchAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await User.findOneAndDelete({ _id: id, role: 'ADMIN' });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await logAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'DELETE',
      module: 'BRANCH_ADMIN',
      ip: req.ip,
    });

    res.status(200).json({ success: true, message: 'Branch admin deleted permanently' });
  } catch (error) {
    console.error('Delete branch admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting branch admin',
      error: config.isDevelopment() ? error.message : undefined,
    });
  }
};

module.exports = {
  createBranchAdmin,
  getBranchAdmins,
  updateBranchAdmin,
  deleteBranchAdmin,
  blockBranchAdmin,
  unblockBranchAdmin,
  resetBranchAdminPassword,
};


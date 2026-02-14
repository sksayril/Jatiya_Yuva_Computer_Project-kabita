const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/staff.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');
const { uploadTeacherImage } = require('../utils/upload');
const config = require('../config/env.config');

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${config.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }
    if (err.message && err.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
      error: config.isDevelopment() ? err.stack : undefined,
    });
  }
  next();
};

router.post('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, uploadTeacherImage, handleUploadError, createTeacher);
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getTeachers);
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getTeacherById);
router.post('/:id/update', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, updateTeacher);
router.post('/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteTeacher);

module.exports = router;


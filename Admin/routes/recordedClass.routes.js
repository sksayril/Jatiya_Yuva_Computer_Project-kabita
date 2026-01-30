const express = require('express');
const router = express.Router();
const {
  createRecordedClass,
  getRecordedClasses,
  getRecordedClassById,
  updateRecordedClass,
  deleteRecordedClass,
} = require('../controllers/recordedClass.controller');
const { authenticateAdmin, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');
const { uploadVideo } = require('../utils/upload');
const config = require('../config/env.config');

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err) {
    // Multer errors
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
    
    // S3 errors
    if (err.storageErrors && err.storageErrors.length > 0) {
      const s3Error = err.storageErrors[0];
      if (s3Error.Code === 'AccessDenied') {
        return res.status(403).json({
          success: false,
          message: 'S3 access denied. Please check AWS permissions or use local storage.',
          error: config.isDevelopment() ? s3Error.message : undefined,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: config.isDevelopment() ? s3Error.message : undefined,
      });
    }
    
    // Generic multer errors
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
      error: config.isDevelopment() ? err.stack : undefined,
    });
  }
  next();
};

// Create recorded class
router.post('/', 
  authenticateAdmin, 
  authorizeRoles(['ADMIN']), 
  enforceBranchIsolation, 
  uploadVideo,
  handleUploadError,
  createRecordedClass
);

// Get all recorded classes
router.get('/', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getRecordedClasses);

// Get recorded class by ID
router.get('/:id', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, getRecordedClassById);

// Update recorded class (with optional file uploads)
router.post('/:id/update',
  authenticateAdmin,
  authorizeRoles(['ADMIN']),
  enforceBranchIsolation,
  uploadVideo,
  handleUploadError,
  updateRecordedClass
);

// Delete recorded class
router.post('/:id/delete', authenticateAdmin, authorizeRoles(['ADMIN']), enforceBranchIsolation, deleteRecordedClass);

module.exports = router;

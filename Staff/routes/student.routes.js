const express = require('express');
const router = express.Router();
const { manualRegistration, scanForm } = require('../controllers/student.controller');
const { authenticateStaff, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');
const { uploadStudentFiles, uploadFormImage } = require('../../Admin/utils/upload');

// Manual student registration
router.post(
  '/manual',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  uploadStudentFiles,
  manualRegistration
);

// Scan form (OCR placeholder)
router.post(
  '/scan-form',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  uploadFormImage,
  scanForm
);

module.exports = router;

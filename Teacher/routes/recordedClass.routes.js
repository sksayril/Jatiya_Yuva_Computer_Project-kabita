const express = require('express');
const router = express.Router();
const { createRecordedClass, getRecordedClasses } = require('../controllers/recordedClass.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBatchIsolation } = require('../middlewares/batchIsolation.middleware');
const { uploadVideo } = require('../../Admin/utils/upload');

// Create recorded class / study material
router.post(
  '/',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  uploadVideo,
  createRecordedClass
);

// Get recorded classes (by teacher)
router.get(
  '/',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  getRecordedClasses
);

module.exports = router;

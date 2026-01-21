const express = require('express');
const router = express.Router();
const { createNotice, getNotices } = require('../controllers/notice.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBatchIsolation } = require('../middlewares/batchIsolation.middleware');

// Create batch notice
router.post(
  '/',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  createNotice
);

// Get notices
router.get(
  '/',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  getNotices
);

module.exports = router;

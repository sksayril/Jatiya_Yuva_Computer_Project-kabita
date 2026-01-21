const express = require('express');
const router = express.Router();
const {
  getAbsentStudents,
  createFollowUp,
  getFollowUps,
  updateFollowUp,
} = require('../controllers/followUp.controller');
const { authenticateStaff, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBranchIsolation } = require('../middlewares/branchIsolation.middleware');

// Get absent students
router.get(
  '/absent-students',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  getAbsentStudents
);

// Create follow-up
router.post(
  '/',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  createFollowUp
);

// Get follow-ups
router.get(
  '/',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  getFollowUps
);

// Update follow-up
router.patch(
  '/:id',
  authenticateStaff,
  authorizeRoles(['STAFF']),
  enforceBranchIsolation,
  updateFollowUp
);

module.exports = router;

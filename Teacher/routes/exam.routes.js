const express = require('express');
const router = express.Router();
const { getExams, uploadMarks, getExamMarks } = require('../controllers/exam.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBatchIsolation } = require('../middlewares/batchIsolation.middleware');

// Get assigned exams
router.get(
  '/',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  getExams
);

// Get exam marks (view/edit)
router.get(
  '/:examId/marks',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  getExamMarks
);

// Upload marks for exam
router.post(
  '/:examId/marks',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  uploadMarks
);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getNotices } = require('../controllers/notice.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

router.get(
  '/',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getNotices
);

module.exports = router;

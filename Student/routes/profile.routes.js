const express = require('express');
const router = express.Router();
const { getProfile, getIdCard } = require('../controllers/profile.controller');
const { authenticateStudent, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceStudentIsolation } = require('../middlewares/studentIsolation.middleware');

router.get(
  '/',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getProfile
);

router.get(
  '/id-card',
  authenticateStudent,
  authorizeRoles(['STUDENT']),
  enforceStudentIsolation,
  getIdCard
);

module.exports = router;

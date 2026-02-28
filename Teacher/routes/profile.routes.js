const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/profile.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');

router.get(
  '/',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  getProfile
);

module.exports = router;

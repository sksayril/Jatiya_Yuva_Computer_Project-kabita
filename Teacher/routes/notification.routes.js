const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notification.controller');
const { authenticateTeacher, authorizeRoles } = require('../middlewares/auth.middleware');
const { enforceBatchIsolation } = require('../middlewares/batchIsolation.middleware');

router.get(
  '/',
  authenticateTeacher,
  authorizeRoles(['TEACHER']),
  enforceBatchIsolation,
  getNotifications
);

module.exports = router;

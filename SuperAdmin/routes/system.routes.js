const express = require('express');
const router = express.Router();
const {
  backupSystem,
  updatePermissions,
  updateNotifications,
} = require('../controllers/system.controller');
const { authenticateSuperAdmin, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/backup', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), backupSystem);
router.post(
  '/permissions',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  updatePermissions
);
router.post(
  '/notifications',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  updateNotifications
);

module.exports = router;


const express = require('express');
const router = express.Router();
const {
  createBranchAdmin,
  getBranchAdmins,
  updateBranchAdmin,
  deleteBranchAdmin,
  blockBranchAdmin,
  unblockBranchAdmin,
  resetBranchAdminPassword,
} = require('../controllers/branchAdmin.controller');
const { authenticateSuperAdmin, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), createBranchAdmin);
router.get('/', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), getBranchAdmins);
router.post('/:id/update', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), updateBranchAdmin);
router.post('/:id/delete', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), deleteBranchAdmin);
router.post('/:id/block', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), blockBranchAdmin);
router.post('/:id/unblock', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), unblockBranchAdmin);
router.post(
  '/:id/reset-password',
  authenticateSuperAdmin,
  authorizeRoles(['SUPER_ADMIN']),
  resetBranchAdminPassword
);

module.exports = router;


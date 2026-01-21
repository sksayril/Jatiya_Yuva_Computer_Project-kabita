const express = require('express');
const router = express.Router();
const {
  createBranch,
  getBranches,
  updateBranch,
  lockBranch,
  unlockBranch,
  softDeleteBranch,
  deleteBranch,
} = require('../controllers/branch.controller');
const { authenticateSuperAdmin, authorizeRoles } = require('../middlewares/auth.middleware');

router.post('/', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), createBranch);
router.get('/', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), getBranches);
router.put('/:id', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), updateBranch);
router.post('/:id/update', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), updateBranch);
router.post('/:id/lock', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), lockBranch);
router.post('/:id/unlock', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), unlockBranch);
router.post('/:id/soft-delete', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), softDeleteBranch);
router.delete('/:id', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), deleteBranch);
router.post('/:id/delete', authenticateSuperAdmin, authorizeRoles(['SUPER_ADMIN']), deleteBranch);

module.exports = router;


const express = require('express');
const router = express.Router();
const { signup, login, logout, getMe } = require('../controllers/auth.controller');
const { authenticateSuperAdmin } = require('../middlewares/auth.middleware');

/**
 * Super Admin Signup Route
 * POST /api/super-admin/signup
 */
router.post('/signup', signup);

/**
 * Super Admin Login Route
 * POST /api/super-admin/login
 */
router.post('/login', login);

/**
 * Super Admin Logout Route
 * POST /api/super-admin/logout
 */
router.post('/logout', logout);

/**
 * Get Current Super Admin Profile (Who I Am)
 * GET /api/super-admin/me
 */
router.get('/me', authenticateSuperAdmin, getMe);

module.exports = router;


const express = require('express');
const router = express.Router();
const { signup, login, logout } = require('../controllers/auth.controller');

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

module.exports = router;


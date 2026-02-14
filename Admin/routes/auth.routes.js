const express = require('express');
const router = express.Router();
const { login, logout, getMe } = require('../controllers/auth.controller');
const { authenticateAdmin } = require('../middlewares/auth.middleware');

// Public routes (no authentication required)
router.post('/login', login);
router.post('/logout', logout);

// Protected routes (authentication required)
router.get('/me', authenticateAdmin, getMe);

module.exports = router;

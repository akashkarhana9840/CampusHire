const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const validate = require('../middleware/validateMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidator');

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.get('/me', authMiddleware, getMe);

module.exports = router;


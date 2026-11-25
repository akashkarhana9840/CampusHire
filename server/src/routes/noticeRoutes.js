const express = require('express');
const router = express.Router();
const { getNotices, createNotice, deleteNotice } = require('../controllers/noticeController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// Protected route for all logged-in roles
router.get('/', authMiddleware, getNotices);

// Officer only management
router.post('/', authMiddleware, checkRole('officer'), createNotice);
router.delete('/:id', authMiddleware, checkRole('officer'), deleteNotice);

module.exports = router;


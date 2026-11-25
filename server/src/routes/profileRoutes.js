const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  uploadResume: uploadResumeController,
  getProfileById,
  streamResume,
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');
const { uploadResume, validatePDFMagicBytes } = require('../middleware/uploadMiddleware');
const { profileSchema } = require('../validators/profileValidator');

// Student profile management
router.get('/me', authMiddleware, checkRole('student'), getMyProfile);
router.put('/me', authMiddleware, checkRole('student'), validate(profileSchema), updateMyProfile);
router.post('/resume', authMiddleware, checkRole('student'), uploadResume.single('resume'), validatePDFMagicBytes, uploadResumeController);

// View profile & resume streaming (Authorization checked inside controller based on role and ownership)
router.get('/:id', authMiddleware, getProfileById);
router.get('/:id/resume', authMiddleware, streamResume);

module.exports = router;


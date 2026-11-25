const express = require('express');
const router = express.Router();
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// Student application management
router.post('/:jobId/apply', authMiddleware, checkRole('student'), applyToJob);
router.get('/student/my', authMiddleware, checkRole('student'), getMyApplications);

// Recruiter & Officer applicant views
router.get('/job/:jobId', authMiddleware, checkRole('recruiter', 'officer'), getApplicantsForJob);

// Recruiter status updates (with ownership checks)
router.patch('/:id/status', authMiddleware, checkRole('recruiter'), updateApplicationStatus);

module.exports = router;


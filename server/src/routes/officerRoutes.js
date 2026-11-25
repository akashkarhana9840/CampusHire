const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserStatus,
  getAllJobsForOfficer,
  getPendingJobs,
  reviewJobApproval,
  getOfficerStats,
} = require('../controllers/officerController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// All routes here strictly require Placement Officer role
router.use(authMiddleware, checkRole('officer'));

// Officer user management (approving recruiters, managing students)
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Officer jobs monitoring and approvals
router.get('/jobs', getAllJobsForOfficer);
router.get('/pending-jobs', getPendingJobs);
router.patch('/jobs/:id/approval', reviewJobApproval);

// Placement statistics summary
router.get('/stats', getOfficerStats);

module.exports = router;


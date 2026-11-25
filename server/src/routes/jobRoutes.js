const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  getRecruiterJobs,
  updateJob,
  closeJob,
} = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');
const { createJobSchema, updateJobSchema } = require('../validators/jobValidator');

// Public/Student/Recruiter/Officer authenticated browsing
router.get('/', authMiddleware, getJobs);
router.get('/recruiter/my', authMiddleware, checkRole('recruiter'), getRecruiterJobs);
router.get('/:id', authMiddleware, getJobById);

// Recruiter actions with ownership checks
router.post('/', authMiddleware, checkRole('recruiter'), validate(createJobSchema), createJob);
router.put('/:id', authMiddleware, checkRole('recruiter'), validate(updateJobSchema), updateJob);
router.patch('/:id/close', authMiddleware, checkRole('recruiter'), closeJob);

module.exports = router;


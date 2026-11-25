const User = require('../models/User');
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const Application = require('../models/Application');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * @desc    Get all users (with optional role & status filter)
 * @route   GET /api/officer/users
 * @access  Protected (Officer)
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });
    return sendSuccess(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activate or deactivate a user account (e.g. approve recruiter)
 * @route   PATCH /api/officer/users/:id/status
 * @access  Protected (Officer)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return sendError(res, 'isActive must be a boolean (true or false)', 400);
    }

    // Prevent officer from deactivating themselves
    if (id === req.user._id.toString()) {
      return sendError(res, 'You cannot modify your own officer active status', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    user.isActive = isActive;
    await user.save();

    const action = isActive ? 'activated / approved' : 'deactivated';
    return sendSuccess(res, `User account ${action} successfully`, user.toSafeObject());
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all jobs across all statuses (with search & filters)
 * @route   GET /api/officer/jobs
 * @access  Protected (Officer)
 */
const getAllJobsForOfficer = async (req, res, next) => {
  try {
    const { status, search, type, branch } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (branch) query.eligibleBranches = branch.toUpperCase();
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'All jobs retrieved for placement officer', jobs);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending job postings awaiting officer approval
 * @route   GET /api/officer/pending-jobs
 * @access  Protected (Officer)
 */
const getPendingJobs = async (req, res, next) => {
  try {
    const pendingJobs = await Job.find({ status: 'pending' })
      .populate('postedBy', 'name email')
      .sort({ createdAt: 1 });

    return sendSuccess(res, 'Pending jobs retrieved successfully', pendingJobs);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject a job posting
 * @route   PATCH /api/officer/jobs/:id/approval
 * @access  Protected (Officer)
 */
const reviewJobApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Must be either 'open' (approved) or 'rejected'
    if (!['open', 'rejected'].includes(status)) {
      return sendError(res, 'Status must be either "open" (approve) or "rejected" (reject)', 400);
    }

    const job = await Job.findById(id).populate('postedBy', 'name email');
    if (!job) {
      return sendError(res, 'Job posting not found', 404);
    }

    if (job.status !== 'pending') {
      return sendError(res, `Cannot modify approval for job with status: ${job.status}`, 400);
    }

    job.status = status;
    await job.save();

    const actionText = status === 'open' ? 'approved and opened for applications' : 'rejected';
    return sendSuccess(res, `Job posting ${actionText} successfully`, job);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get high level placement overview statistics
 * @route   GET /api/officer/stats
 * @access  Protected (Officer)
 */
const getOfficerStats = async (req, res, next) => {
  try {
    const [totalStudents, totalRecruiters, pendingRecruiters, totalJobs, openJobs, totalApplications, totalHired] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'recruiter' }),
        User.countDocuments({ role: 'recruiter', isActive: false }),
        Job.countDocuments(),
        Job.countDocuments({ status: 'open' }),
        Application.countDocuments(),
        Application.countDocuments({ status: 'Hired' }),
      ]);

    return sendSuccess(res, 'Overview statistics retrieved', {
      totalStudents,
      totalRecruiters,
      pendingRecruiters,
      totalJobs,
      openJobs,
      totalApplications,
      totalHired,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUserStatus,
  getAllJobsForOfficer,
  getPendingJobs,
  reviewJobApproval,
  getOfficerStats,
};


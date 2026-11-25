const mongoose = require('mongoose');
const Job = require('../models/Job');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * @desc    Create a new job/internship posting
 * @route   POST /api/jobs
 * @access  Protected (Recruiter)
 */
const createJob = async (req, res, next) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user._id,
      status: 'pending', // Postings require officer approval to go 'open'
    };

    const job = await Job.create(jobData);
    return sendSuccess(
      res,
      'Job posting submitted successfully. It is currently pending approval by the Placement Officer.',
      job,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all open/approved jobs (with search, filter, pagination)
 * @route   GET /api/jobs
 * @access  Protected (Student, Recruiter, Officer)
 */
const getJobs = async (req, res, next) => {
  try {
    const {
      search,
      type,
      branch,
      minCGPA,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {
      status: 'open',
    };

    // For students, strictly filter only non-expired jobs whose deadline is in the future
    if (req.user.role === 'student') {
      query.deadline = { $gte: new Date() };
    }

    // Text search on title and company
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { requiredSkills: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by type: job or internship
    if (type) {
      query.type = type;
    }

    // Filter by eligible branch
    if (branch) {
      query.eligibleBranches = branch.toUpperCase();
    }

    // Filter by max required CGPA
    if (minCGPA) {
      query.minCGPA = { $lte: Number(minCGPA) };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Job.countDocuments(query),
    ]);

    return sendSuccess(res, 'Jobs retrieved successfully', {
      jobs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single job details
 * @route   GET /api/jobs/:id
 * @access  Protected
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
    if (!job) {
      return sendError(res, 'Job posting not found', 404);
    }

    // If job is not open, only the owner recruiter or an officer can view it
    if (job.status !== 'open') {
      const isOwner = job.postedBy._id.toString() === req.user._id.toString();
      const isOfficer = req.user.role === 'officer';
      if (!isOwner && !isOfficer) {
        return sendError(res, 'This job posting is not currently available for viewing', 403);
      }
    }

    return sendSuccess(res, 'Job details retrieved', job);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get postings created by the logged-in recruiter
 * @route   GET /api/jobs/recruiter/my
 * @access  Protected (Recruiter)
 */
const getRecruiterJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, 'Recruiter jobs retrieved', jobs);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a job posting (Recruiter ownership check)
 * @route   PUT /api/jobs/:id
 * @access  Protected (Recruiter)
 */
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendError(res, 'Job posting not found', 404);
    }

    // Strict ownership check: Recruiter can only update their own posting
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: You can only edit jobs posted by your account', 403);
    }

    // Whitelist only editable fields (ignore status, postedBy, or arbitrary injected fields)
    const allowedFields = [
      'company',
      'title',
      'type',
      'description',
      'location',
      'package',
      'deadline',
      'minCGPA',
      'maxBacklogs',
      'eligibleBranches',
      'requiredSkills',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Rule: if a recruiter edits minCGPA, maxBacklogs or eligibleBranches on an OPEN job,
    // set status back to 'pending' for placement officer re-approval.
    let statusResetToPending = false;
    const isCriteriaModified =
      (updates.minCGPA !== undefined && updates.minCGPA !== job.minCGPA) ||
      (updates.maxBacklogs !== undefined && updates.maxBacklogs !== job.maxBacklogs) ||
      (updates.eligibleBranches !== undefined &&
        JSON.stringify(updates.eligibleBranches.sort()) !== JSON.stringify(job.eligibleBranches.sort()));

    if (job.status === 'open' && isCriteriaModified) {
      updates.status = 'pending';
      statusResetToPending = true;
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    const message = statusResetToPending
      ? 'Eligibility criteria modified. Job posting has been reset to "pending" for Officer re-approval.'
      : 'Job posting updated successfully';

    return sendSuccess(res, message, updatedJob);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Close a job posting (Recruiter ownership check)
 * @route   PATCH /api/jobs/:id/close
 * @access  Protected (Recruiter)
 */
const closeJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return sendError(res, 'Job posting not found', 404);
    }

    // Strict ownership check
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: You can only close jobs posted by your account', 403);
    }

    if (job.status === 'closed') {
      return sendError(res, 'Job posting is already closed', 400);
    }

    job.status = 'closed';
    await job.save();

    return sendSuccess(res, 'Job posting closed successfully', job);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  getRecruiterJobs,
  updateJob,
  closeJob,
};


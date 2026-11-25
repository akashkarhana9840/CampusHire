const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const { checkStudentEligibility, isValidStatusTransition, ALLOWED_STATUS_TRANSITIONS } = require('../services/eligibilityService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * @desc    Apply to a job
 * @route   POST /api/applications/:jobId/apply
 * @access  Protected (Student)
 */
const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.isValidObjectId(jobId)) {
      return sendError(res, 'Invalid Job ID format', 400);
    }

    // 1. Fetch job
    const job = await Job.findById(jobId);
    if (!job) {
      return sendError(res, 'Job posting not found', 404);
    }

    // 2. Reject if job is not open (e.g. pending, closed, rejected)
    if (job.status !== 'open') {
      return sendError(res, `Cannot apply to this opportunity: Posting is ${job.status}`, 400);
    }

    // 3. Reject if deadline has passed
    if (new Date(job.deadline).getTime() < Date.now()) {
      return sendError(res, 'Application deadline for this job has expired', 400);
    }

    // 4. Fetch student profile
    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return sendError(res, 'Please complete your academic profile before applying to jobs', 400);
    }

    if (!profile.resumeFileId) {
      return sendError(res, 'Please upload your resume PDF to your profile before applying', 400);
    }

    // 5. Evaluate academic eligibility (branch, CGPA, backlogs)
    const eligibility = checkStudentEligibility(profile, job);
    if (!eligibility.isEligible) {
      return sendError(res, 'You do not meet the eligibility criteria for this position', 400, {
        reasons: eligibility.reasons,
      });
    }

    // 6. Check for duplicate application
    const existingApplication = await Application.findOne({
      studentId: req.user._id,
      jobId: job._id,
    });
    if (existingApplication) {
      return sendError(res, 'You have already submitted an application for this job', 409);
    }

    // 7. Create application record with academic snapshot and initial statusHistory
    const application = await Application.create({
      studentId: req.user._id,
      jobId: job._id,
      applicantSnapshot: {
        branch: profile.branch.toUpperCase(),
        rollNo: profile.rollNo.toUpperCase(),
        cgpa: profile.cgpa,
        backlogs: profile.backlogs,
        skills: profile.skills || [],
        resumeFileId: profile.resumeFileId,
      },
      status: 'Applied',
      appliedAt: new Date(),
      statusHistory: [
        {
          status: 'Applied',
          changedAt: new Date(),
          changedBy: req.user._id,
        },
      ],
    });

    const populated = await Application.findById(application._id)
      .populate('jobId', 'company title type location package deadline')
      .populate('studentId', 'name email');

    return sendSuccess(res, 'Application submitted successfully', populated, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'You have already applied for this opportunity', 409);
    }
    next(error);
  }
};

/**
 * @desc    Get all applications submitted by logged-in student
 * @route   GET /api/applications/student/my
 * @access  Protected (Student)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ studentId: req.user._id })
      .populate({
        path: 'jobId',
        select: 'company title type location package deadline status',
      })
      .sort({ appliedAt: -1 });

    return sendSuccess(res, 'Applications retrieved successfully', applications);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get applicant roster for a specific job (Recruiter ownership checked, Officer can view all)
 * @route   GET /api/applications/job/:jobId
 * @access  Protected (Recruiter, Officer)
 */
const getApplicantsForJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendError(res, 'Job posting not found', 404);
    }

    // Recruiter ownership check
    if (req.user.role === 'recruiter' && job.postedBy.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: You can only view applicants for your own job postings', 403);
    }

    const query = { jobId };
    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('studentId', 'name email')
      .sort({ appliedAt: -1 });

    const enrichedApplicants = applications.map((app) => {
      return {
        _id: app._id,
        jobId: app.jobId,
        student: app.studentId,
        // Displays eligibility snapshot frozen at application submission time
        profileSnapshot: app.applicantSnapshot,
        status: app.status,
        appliedAt: app.appliedAt,
        statusHistory: app.statusHistory,
      };
    });

    return sendSuccess(res, 'Applicants retrieved successfully', {
      job: {
        _id: job._id,
        company: job.company,
        title: job.title,
        status: job.status,
      },
      applicants: enrichedApplicants,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update applicant status (with FSM transition validation & ownership check)
 * @route   PATCH /api/applications/:id/status
 * @access  Protected (Recruiter)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    if (!newStatus) {
      return sendError(res, 'New status is required', 400);
    }

    if (req.user.role !== 'recruiter') {
    return sendError(res, 'Only recruiters can change application status', 403);
  }
  const application = await Application.findById(id).populate('jobId');
    if (!application) {
      return sendError(res, 'Application not found', 404);
    }

    // Ownership check: Recruiter can only modify applications for their own postings
    if (application.jobId.postedBy.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: You can only update applications for your own postings', 403);
    }

    // Validate status transition rule (FSM)
    const currentStatus = application.status;
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
      return sendError(
        res,
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: [${allowed.join(', ')}]`,
        400
      );
    }

    // Record transition history
    application.status = newStatus;
    application.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      changedBy: req.user._id,
    });

    await application.save();

    return sendSuccess(res, `Application status updated to "${newStatus}"`, application);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
};


const mongoose = require('mongoose');
const { Readable } = require('stream');
const Profile = require('../models/Profile');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { getGridFSBucket } = require('../config/gridfs');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * @desc    Get current student's own profile
 * @route   GET /api/profile/me
 * @access  Protected (Student)
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id }).populate('userId', 'name email role');
    if (!profile) {
      return sendSuccess(res, 'Profile has not been created yet', null);
    }
    return sendSuccess(res, 'Profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update student's profile
 * @route   PUT /api/profile/me
 * @access  Protected (Student)
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const { branch, rollNo, cgpa, backlogs, skills, contact } = req.body;

    // Check if rollNo is already taken by another profile
    const existingRoll = await Profile.findOne({
      rollNo: rollNo.toUpperCase(),
      userId: { $ne: req.user._id },
    });
    if (existingRoll) {
      return sendError(res, 'Roll number is already associated with another student account', 400);
    }

    let profile = await Profile.findOne({ userId: req.user._id });

    if (profile) {
      // Update existing profile
      profile.branch = branch;
      profile.rollNo = rollNo.toUpperCase();
      profile.cgpa = cgpa;
      profile.backlogs = backlogs;
      profile.skills = skills || [];
      if (contact) profile.contact = contact;
      await profile.save();
    } else {
      // Create new profile
      profile = await Profile.create({
        userId: req.user._id,
        branch,
        rollNo: rollNo.toUpperCase(),
        cgpa,
        backlogs,
        skills: skills || [],
        contact: contact || {},
      });
    }

    const populated = await Profile.findById(profile._id).populate('userId', 'name email role');
    return sendSuccess(res, 'Profile updated successfully', populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload student resume PDF directly to MongoDB GridFS (max 2MB)
 * @route   POST /api/profile/resume
 * @access  Protected (Student)
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please upload a PDF file', 400);
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      return sendError(res, 'File storage service unavailable', 500);
    }

    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return sendError(res, 'Please create your academic profile first before uploading resume', 400);
    }

    // If an old resume already exists in GridFS, remove it to save storage
    if (profile.resumeFileId) {
      try {
        await bucket.delete(new mongoose.Types.ObjectId(profile.resumeFileId));
      } catch (err) {
        // GridFS delete error ignored if file was already cleared
      }
    }

    // Stream buffer into GridFS
    const uploadStream = bucket.openUploadStream(
      `resume_${req.user._id}_${Date.now()}.pdf`,
      {
        contentType: 'application/pdf',
        metadata: {
          uploadedBy: req.user._id,
          originalName: req.file.originalname,
        },
      }
    );

    const readableBuffer = new Readable();
    readableBuffer.push(req.file.buffer);
    readableBuffer.push(null);

    readableBuffer
      .pipe(uploadStream)
      .on('error', (uploadErr) => {
        return sendError(res, `Failed to store resume: ${uploadErr.message}`, 500);
      })
      .on('finish', async (savedFile) => {
        profile.resumeFileId = savedFile._id;
        profile.resumeOriginalName = req.file.originalname;
        profile.resumeUploadedAt = new Date();
        await profile.save();

        return sendSuccess(res, 'Resume uploaded successfully to GridFS', {
          resumeFileId: savedFile._id,
          fileName: req.file.originalname,
          uploadedAt: profile.resumeUploadedAt,
        });
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View a student profile
 * @route   GET /api/profile/:id
 * @access  Protected (Student view self, Officer view all, Recruiter view if student applied to their job)
 */
const getProfileById = async (req, res, next) => {
  try {
    const { id } = req.params; // This is the Profile._id or User._id

    let profile = await Profile.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { userId: mongoose.isValidObjectId(id) ? id : null }],
    }).populate('userId', 'name email role');

    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // Authorization rule:
    // 1. Officer can view any profile
    // 2. Student can view their own profile
    // 3. Recruiter can ONLY view if student applied to at least one job posted by this recruiter
    if (req.user.role === 'officer') {
      return sendSuccess(res, 'Profile retrieved', profile);
    }

    if (req.user.role === 'student') {
      if (profile.userId._id.toString() !== req.user._id.toString()) {
        return sendError(res, 'Access denied: You can only view your own profile', 403);
      }
      return sendSuccess(res, 'Profile retrieved', profile);
    }

    if (req.user.role === 'recruiter') {
      // Find jobs posted by this recruiter
      const recruiterJobs = await Job.find({ postedBy: req.user._id }).select('_id');
      const recruiterJobIds = recruiterJobs.map((j) => j._id);

      // Check if student applied to any of these jobs
      const hasApplied = await Application.findOne({
        studentId: profile.userId._id,
        jobId: { $in: recruiterJobIds },
      });

      if (!hasApplied) {
        return sendError(
          res,
          'Access denied: You can only view profiles of students who applied to your posted opportunities',
          403
        );
      }

      return sendSuccess(res, 'Profile retrieved', profile);
    }

    return sendError(res, 'Unauthorized', 403);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Stream resume PDF securely from MongoDB GridFS
 * @route   GET /api/profile/:id/resume
 * @access  Protected (Officer, Student self, Recruiter if applied)
 */
const streamResume = async (req, res, next) => {
  try {
    const { id } = req.params;

    const profile = await Profile.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { userId: mongoose.isValidObjectId(id) ? id : null }],
    });

    if (!profile || !profile.resumeFileId) {
      return sendError(res, 'Resume file not found for this profile', 404);
    }

    // Access control checks
    if (req.user.role === 'student' && profile.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied: You can only download your own resume', 403);
    }

    if (req.user.role === 'recruiter') {
      const recruiterJobs = await Job.find({ postedBy: req.user._id }).select('_id');
      const hasApplied = await Application.findOne({
        studentId: profile.userId,
        jobId: { $in: recruiterJobs.map((j) => j._id) },
      });

      if (!hasApplied) {
        return sendError(
          res,
          'Access denied: You can only view resumes of students who applied to your jobs',
          403
        );
      }
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      return sendError(res, 'Storage service unavailable', 500);
    }

    const fileId = new mongoose.Types.ObjectId(profile.resumeFileId);

    // Verify file exists in GridFS
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return sendError(res, 'Resume file not found in storage', 404);
    }

    const fileMeta = files[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${profile.resumeOriginalName || 'resume.pdf'}"`
    );

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('error', (err) => {
      return sendError(res, `Error streaming file: ${err.message}`, 500);
    });

    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadResume,
  getProfileById,
  streamResume,
};


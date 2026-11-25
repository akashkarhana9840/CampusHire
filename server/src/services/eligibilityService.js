const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Profile = require('../models/Profile');

/**
 * Service to evaluate student eligibility for a specific job
 * Criteria checked:
 * 1. Profile completeness & Resume presence
 * 2. Academic branch matches eligibleBranches
 * 3. Student CGPA >= job minCGPA
 * 4. Student backlogs <= job maxBacklogs
 */
const checkStudentEligibility = (profile, job) => {
  const reasons = [];

  if (!profile) {
    return {
      isEligible: false,
      reasons: ['Student academic profile has not been created yet'],
    };
  }

  if (!profile.resumeFileId) {
    reasons.push('Resume has not been uploaded to profile');
  }

  // Branch check (case-insensitive comparison)
  const studentBranchNormalized = (profile.branch || '').trim().toUpperCase();
  const eligibleBranchesNormalized = (job.eligibleBranches || []).map((b) => b.trim().toUpperCase());

  if (!eligibleBranchesNormalized.includes(studentBranchNormalized)) {
    reasons.push(
      `Student branch (${profile.branch}) is not in eligible branches: [${job.eligibleBranches.join(', ')}]`
    );
  }

  // CGPA check
  if (profile.cgpa < job.minCGPA) {
    reasons.push(`Student CGPA (${profile.cgpa}) is lower than minimum required (${job.minCGPA})`);
  }

  // Backlogs check
  if (profile.backlogs > job.maxBacklogs) {
    reasons.push(`Student has ${profile.backlogs} backlog(s), which exceeds maximum allowed (${job.maxBacklogs})`);
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
};

/**
 * Allowed status transitions for Applications (Finite State Machine)
 * Applied -> Shortlisted | Rejected
 * Shortlisted -> Interview | Rejected
 * Interview -> Hired | Rejected
 * Hired -> [] (Terminal state)
 * Rejected -> [] (Terminal state)
 */
const ALLOWED_STATUS_TRANSITIONS = {
  Applied: ['Shortlisted', 'Rejected'],
  Shortlisted: ['Interview', 'Rejected'],
  Interview: ['Hired', 'Rejected'],
  Hired: [],
  Rejected: [],
};

const isValidStatusTransition = (currentStatus, newStatus) => {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
};

module.exports = {
  checkStudentEligibility,
  ALLOWED_STATUS_TRANSITIONS,
  isValidStatusTransition,
};


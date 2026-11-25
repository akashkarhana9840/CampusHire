const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['job', 'internship'],
        message: '{VALUE} is not a valid opportunity type',
      },
      required: [true, 'Type (job or internship) is required'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    location: {
      type: String,
      default: 'On-site',
      trim: true,
    },
    package: {
      type: String, // e.g., '12 LPA' or '45,000 / month'
      required: [true, 'Package / CTC is required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    minCGPA: {
      type: Number,
      required: [true, 'Minimum CGPA is required'],
      min: 0,
      max: 10,
      default: 0,
    },
    maxBacklogs: {
      type: Number,
      required: [true, 'Maximum allowed backlogs is required'],
      min: 0,
      default: 0,
    },
    eligibleBranches: {
      type: [String],
      required: [true, 'At least one eligible branch must be specified'],
      enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'open', 'closed', 'rejected'],
      default: 'pending', // Requires officer approval to become 'open'
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance
jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ eligibleBranches: 1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;


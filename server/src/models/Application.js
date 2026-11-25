const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    // Snapshot of student's academic profile at the exact moment of application
    applicantSnapshot: {
      branch: { type: String, required: true },
      rollNo: { type: String, required: true },
      cgpa: { type: Number, required: true },
      backlogs: { type: Number, required: true },
      skills: { type: [String], default: [] },
      resumeFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Hired', 'Rejected'],
      default: 'Applied',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['Applied', 'Shortlisted', 'Interview', 'Hired', 'Rejected'],
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate applications from same student to same job
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ studentId: 1, status: 1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;


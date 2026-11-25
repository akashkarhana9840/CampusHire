const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // 1:1 relationship with User
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'],
      uppercase: true,
      trim: true,
    },
    rollNo: {
      type: String,
      required: [true, 'Roll Number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10.0'],
    },
    backlogs: {
      type: Number,
      required: [true, 'Backlogs count is required'],
      min: [0, 'Backlogs cannot be negative'],
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    contact: {
      phone: {
        type: String,
        trim: true,
      },
      linkedin: {
        type: String,
        trim: true,
      },
      github: {
        type: String,
        trim: true,
      },
    },
    resumeFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // References GridFS file in bucket 'resumes.files'
    },
    resumeOriginalName: {
      type: String,
      default: null,
    },
    resumeUploadedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for academic lookups
profileSchema.index({ branch: 1, cgpa: -1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;

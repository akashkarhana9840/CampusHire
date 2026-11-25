const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['student', 'recruiter', 'officer'],
      default: 'student',
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    isActive: {
      type: Boolean,
      default: function () {
        // Students are active by default. Recruiters require officer approval (isActive=false).
        return this.role === 'student';
      },
    },
    collegeId: {
      type: String,
      required: function() { return this.role === 'student'; },
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password match
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

// Return safe user object omitting passwordHash
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;


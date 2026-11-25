const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Generate signed JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a student or recruiter
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, collegeId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'User with this email already exists', 400);
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user (Recruiter gets isActive=false, Student gets isActive=true)
    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      isActive: role === 'student', // Recruiters require officer approval
      ...(role === 'student' && { collegeId }),
    });

    // If recruiter, notify that approval is required
    if (role === 'recruiter') {
      return sendSuccess(
        res,
        'Recruiter registration successful! Your account is pending placement officer approval before you can log in.',
        {
          user: user.toSafeObject(),
        },
        201
      );
    }

    // For students, generate token immediately
    const token = generateToken(user._id, user.role);

    return sendSuccess(
      res,
      'Registration successful!',
      {
        user: user.toSafeObject(),
        token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      if (user.role === 'recruiter') {
        return sendError(
          res,
          'Your account is awaiting approval from the Placement Officer. Please try again once approved.',
          403
        );
      }
      return sendError(res, 'Your account has been deactivated. Please contact the administrator.', 403);
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return sendSuccess(res, 'Login successful', {
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Protected
 */
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 'User session retrieved successfully', {
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};


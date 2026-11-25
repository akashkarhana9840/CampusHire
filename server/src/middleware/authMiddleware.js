const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseFormatter');

/**
 * Verifies JWT from Bearer Authorization header
 * Attaches authenticated user document to req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication token missing or invalid format', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account is deactivated or awaiting officer approval', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired. Please login again.', 401);
    }
    return sendError(res, 'Invalid or malformed token', 401);
  }
};

module.exports = authMiddleware;


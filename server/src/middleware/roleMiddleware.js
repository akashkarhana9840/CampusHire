const { sendError } = require('../utils/responseFormatter');

/**
 * Role-Based Access Control (RBAC) middleware factory
 * @param  {...string} allowedRoles - Array of roles permitted (e.g. 'student', 'recruiter', 'officer')
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        403
      );
    }

    next();
  };
};

module.exports = checkRole;


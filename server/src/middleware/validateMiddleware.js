const { sendError } = require('../utils/responseFormatter');

/**
 * Middleware factory for validating request bodies against Zod schemas
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return sendError(res, 'Validation failed', 400, formattedErrors);
    }
    return sendError(res, 'Invalid request data', 400);
  }
};

module.exports = validate;


const { sendError } = require('../utils/responseFormatter');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    const field = keys.join(', ');
    return sendError(
      res,
      `A duplicate record already exists with that ${field || 'value'}.`,
      409
    );
  }

  // Mongoose CastError (e.g. invalid ObjectId in URL params)
  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    return sendError(res, `Invalid ID format: "${err.value}"`, 400);
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return sendError(res, messages.join(', '), 400);
  }

  // Fallback for general unhandled exceptions
  const statusCode = err.statusCode || 500;
  const genericMessage = 'Internal Server Error';
  const message = (process.env.NODE_ENV === 'production') ? genericMessage : (err.message || genericMessage);


  return sendError(res, message, statusCode);
};

module.exports = errorHandler;


import ApiError from '../utils/ApiError.js';

/**
 * Global Express error-handling middleware.
 * Normalises known error shapes (ApiError, Mongoose errors, duplicate keys)
 * into a consistent JSON response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // ── ApiError (our own) ────────────────────────────────────────────
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // ── Mongoose ValidationError ──────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // ── Mongoose CastError (bad ObjectId) ─────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID',
      errors: [],
    });
  }

  // ── Duplicate key (code 11000) ────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ');
    return res.status(409).json({
      success: false,
      message: `Already exists${field ? ` (duplicate: ${field})` : ''}`,
      errors: [],
    });
  }

  // ── Fallback — unexpected error ───────────────────────────────────
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
  });
};

export default errorHandler;

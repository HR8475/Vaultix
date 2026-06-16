import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

/**
 * Global Express error-handling middleware.
 * Normalises known error shapes (ApiError, Mongoose errors, duplicate keys)
 * into a consistent JSON response with structured logging.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // ── ApiError (our own) ────────────────────────────────────────────
  if (err instanceof ApiError) {
    logger.warn(`ApiError ${err.statusCode}: ${err.message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // ── Mongoose ValidationError ──────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    logger.warn('Mongoose validation failed', { errors: messages, path: req.path });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // ── Mongoose CastError (bad ObjectId) ─────────────────────────────
  if (err.name === 'CastError') {
    logger.warn(`CastError on ${err.path}: ${err.value}`, { path: req.path });
    return res.status(400).json({
      success: false,
      message: 'Invalid ID',
      errors: [],
    });
  }

  // ── Duplicate key (code 11000) ────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ');
    logger.warn(`Duplicate key: ${field}`, { path: req.path });
    return res.status(409).json({
      success: false,
      message: `Already exists${field ? ` (duplicate: ${field})` : ''}`,
      errors: [],
    });
  }

  // ── Fallback — unexpected error ───────────────────────────────────
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    message: config.isProduction ? 'Internal server error' : err.message,
    errors: [],
  });
};

export default errorHandler;

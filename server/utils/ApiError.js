/**
 * Custom API error class with HTTP status code and optional validation errors array.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code.
   * @param {string} message    - Human-readable error message.
   * @param {Array}  errors     - Optional array of field-level errors.
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 Bad Request */
  static badRequest(msg = 'Bad request') {
    return new ApiError(400, msg);
  }

  /** 401 Unauthorized */
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }

  /** 403 Forbidden */
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }

  /** 404 Not Found */
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }

  /** 409 Conflict */
  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg);
  }

  /** 500 Internal Server Error */
  static internal(msg = 'Internal server error') {
    return new ApiError(500, msg);
  }
}

export default ApiError;

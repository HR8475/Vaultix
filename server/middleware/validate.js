import ApiError from '../utils/ApiError.js';

/**
 * Simple request-body validation middleware factory.
 *
 * @param {Array<{ field: string, type: string, message: string }>} rules
 *   Each rule describes a required body field, its expected `typeof`, and an
 *   error message to surface when missing or wrong type.
 * @returns {Function} Express middleware.
 *
 * @example
 *   router.post('/', validateBody([
 *     { field: 'email', type: 'string', message: 'Email is required' },
 *   ]), controller);
 */
const validateBody = (rules) => {
  return (req, _res, next) => {
    const errors = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Check presence
      if (value === undefined || value === null) {
        errors.push({ field: rule.field, message: rule.message });
        continue;
      }

      // Check type
      // eslint-disable-next-line valid-typeof
      if (typeof value !== rule.type) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be of type ${rule.type}`,
        });
        continue;
      }

      // Non-empty check for strings
      if (rule.type === 'string' && value.trim().length === 0) {
        errors.push({ field: rule.field, message: rule.message });
      }
    }

    if (errors.length > 0) {
      const err = ApiError.badRequest('Validation failed');
      err.errors = errors;
      return next(err);
    }

    next();
  };
};

export default validateBody;

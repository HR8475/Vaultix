import mongoSanitize from 'express-mongo-sanitize';

/**
 * Sanitize user input to prevent NoSQL injection attacks.
 * Strips any keys containing `$` or `.` from req.body, req.query, and req.params.
 */
export const noSqlSanitize = mongoSanitize({
  replaceWith: '_',
  allowDots: false,
});

/**
 * Lightweight XSS sanitizer — strips HTML tags and common script patterns
 * from string values in request body recursively.
 */
function stripTags(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

function sanitizeDeep(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return stripTags(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeDeep);
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, val] of Object.entries(obj)) {
      cleaned[key] = sanitizeDeep(val);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Express middleware that sanitizes req.body against XSS.
 */
export const xssSanitize = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeDeep(req.body);
  }
  next();
};

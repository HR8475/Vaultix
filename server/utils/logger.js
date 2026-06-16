import winston from 'winston';
import config from '../config/index.js';

/* ── Sensitive field names to mask in logs ───────────────────────── */
const SENSITIVE_FIELDS = new Set([
  'password', 'token', 'refreshToken', 'accessToken',
  'secret', 'value', 'plaintext', 'authorization',
  'jwt', 'encryptionKey', 'apiKey',
]);

/**
 * Recursively mask values of sensitive keys in an object.
 * Returns a new object — never mutates the original.
 */
export function maskSensitive(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);
  if (typeof obj !== 'object') return obj;

  const masked = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      masked[key] = '***REDACTED***';
    } else if (typeof val === 'object' && val !== null) {
      masked[key] = maskSensitive(val);
    } else {
      masked[key] = val;
    }
  }
  return masked;
}

/* ── Custom format: add timestamp + mask sensitive data ──────────── */
const maskFormat = winston.format((info) => {
  if (info.meta && typeof info.meta === 'object') {
    info.meta = maskSensitive(info.meta);
  }
  return info;
});

/* ── Transports ──────────────────────────────────────────────────── */
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const extras = Object.keys(meta).length
          ? ` ${JSON.stringify(meta)}`
          : '';
        return `${timestamp} [${level}]: ${message}${extras}`;
      }),
    ),
  }),
];

/* In production write to files as well */
if (config.isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5_242_880, // 5 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  );
}

/* ── Logger instance ─────────────────────────────────────────────── */
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    maskFormat(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'vaultix-api' },
  transports,
});

export default logger;

/**
 * Centralized configuration — validates and exports all environment
 * variables with sensible defaults for development.
 *
 * In production every required variable MUST be present; missing ones
 * will cause the process to exit immediately so misconfiguration is
 * caught early rather than at runtime.
 */

const isProduction = process.env.NODE_ENV === 'production';

/* ── helpers ─────────────────────────────────────────────────────── */

/**
 * Read an env var. Throw in production if `required` and missing.
 */
function env(key, fallback) {
  const value = process.env[key];
  if (value !== undefined && value !== '') return value;
  if (fallback !== undefined) return fallback;
  if (isProduction) {
    console.error(`❌  Missing required env variable: ${key}`);
    process.exit(1);
  }
  return undefined;
}

function envInt(key, fallback) {
  const raw = env(key, String(fallback));
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/* ── config object ───────────────────────────────────────────────── */

const config = Object.freeze({
  /* Server */
  port: envInt('PORT', 5000),
  nodeEnv: env('NODE_ENV', 'development'),
  isProduction,

  /* MongoDB */
  mongodbUri: env('MONGODB_URI', 'mongodb://localhost:27017/vaultix'),

  /* JWT */
  jwtSecret: env('JWT_SECRET', 'dev-jwt-secret-DO-NOT-USE-IN-PRODUCTION'),
  jwtExpiry: env('JWT_EXPIRY', '15m'),

  /* Refresh tokens */
  refreshTokenSecret: env('REFRESH_TOKEN_SECRET', 'dev-refresh-secret-DO-NOT-USE-IN-PRODUCTION'),
  refreshTokenExpiry: env('REFRESH_TOKEN_EXPIRY', '7d'),

  /* Encryption */
  encryptionKey: env('ENCRYPTION_KEY'),

  /* Client */
  clientUrl: env('CLIENT_URL', 'http://localhost:5173'),
  allowedOrigins: env('ALLOWED_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),

  /* Rate limiting */
  rateLimitWindowMs: envInt('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  rateLimitMax: envInt('RATE_LIMIT_MAX', 100),
  authRateLimitMax: envInt('AUTH_RATE_LIMIT_MAX', 10),

  /* Logging */
  logLevel: env('LOG_LEVEL', isProduction ? 'info' : 'debug'),
});

export default config;

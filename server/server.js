import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import hpp from 'hpp';

import config from './config/index.js';
import logger from './utils/logger.js';
import connectDB from './config/db.js';

/* ── Security Middleware ─────────────────────────────────────────── */
import securityHeaders from './middleware/securityHeaders.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { noSqlSanitize, xssSanitize } from './middleware/sanitize.js';

/* ── Routes ──────────────────────────────────────────────────────── */
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import environmentRoutes from './routes/environmentRoutes.js';
import secretRoutes from './routes/secretRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// ── Trust proxy (required behind Render / Vercel / Nginx) ────────
app.set('trust proxy', 1);

// ── Global Middleware ────────────────────────────────────────────
app.use(securityHeaders);
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(hpp()); // protect against HTTP parameter pollution
app.use(noSqlSanitize);
app.use(xssSanitize);

// ── Request logging ─────────────────────────────────────────────
app.use(
  morgan('short', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ── Rate Limiting ───────────────────────────────────────────────
app.use('/api/', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// ── API Routes ──────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/workspaces', projectRoutes);
app.use('/api/v1/workspaces', environmentRoutes);
app.use('/api/v1/workspaces', secretRoutes);

// ── Health check ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler (must be last) ────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  const server = app.listen(config.port, () => {
    logger.info(`🚀  Vaultix server running on port ${config.port} [${config.nodeEnv}]`);
  });

  /* Graceful shutdown */
  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force close after 10s
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

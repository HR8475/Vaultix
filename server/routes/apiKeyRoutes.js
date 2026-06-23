import { Router } from 'express';
import {
  createKey,
  listKeys,
  getKey,
  revokeKey,
  rotateKey,
} from '../controllers/apiKeyController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/rbac.js';
import validateBody from '../middleware/validate.js';

const router = Router();

// All routes are mounted under /api/v1/workspaces

// Create a new API key
router.post(
  '/:workspaceId/api-keys',
  protect,
  requireRole('owner', 'admin'),
  validateBody([
    { field: 'name', type: 'string', message: 'Key name is required' },
  ]),
  createKey
);

// List all API keys for a workspace
router.get(
  '/:workspaceId/api-keys',
  protect,
  requireRole('owner', 'admin'),
  listKeys
);

// Get a single API key
router.get(
  '/:workspaceId/api-keys/:keyId',
  protect,
  requireRole('owner', 'admin'),
  getKey
);

// Revoke an API key
router.delete(
  '/:workspaceId/api-keys/:keyId',
  protect,
  requireRole('owner', 'admin'),
  revokeKey
);

// Rotate an API key
router.post(
  '/:workspaceId/api-keys/:keyId/rotate',
  protect,
  requireRole('owner', 'admin'),
  rotateKey
);

export default router;

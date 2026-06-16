import { Router } from 'express';
import {
  getSecrets,
  revealSecret,
  createSecret,
  updateSecret,
  deleteSecret,
  bulkImport,
} from '../controllers/secretController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/rbac.js';
import validateBody from '../middleware/validate.js';

const router = Router();

// Base mounted path in server.js is /api/v1/workspaces

// List secrets
router.get(
  '/:workspaceId/environments/:projectId/:envId/secrets',
  protect,
  requireRole('owner', 'admin', 'member', 'viewer'),
  getSecrets
);

// Reveal secret plaintext
router.get(
  '/:workspaceId/environments/:projectId/:envId/secrets/:secretId/reveal',
  protect,
  requireRole('owner', 'admin', 'member'),
  revealSecret
);

// Create single secret
router.post(
  '/:workspaceId/environments/:projectId/:envId/secrets',
  protect,
  requireRole('owner', 'admin', 'member'),
  validateBody([
    { field: 'key', type: 'string', message: 'Secret key is required' },
    { field: 'value', type: 'string', message: 'Secret value is required' },
  ]),
  createSecret
);

// Bulk import secrets
router.post(
  '/:workspaceId/environments/:projectId/:envId/secrets/import',
  protect,
  requireRole('owner', 'admin', 'member'),
  validateBody([
    { field: 'envString', type: 'string', message: 'Env string is required' },
  ]),
  bulkImport
);

// Update secret (add a new version)
router.patch(
  '/:workspaceId/environments/:projectId/:envId/secrets/:secretId',
  protect,
  requireRole('owner', 'admin', 'member'),
  validateBody([
    { field: 'value', type: 'string', message: 'Secret value is required' },
  ]),
  updateSecret
);

// Delete secret
router.delete(
  '/:workspaceId/environments/:projectId/:envId/secrets/:secretId',
  protect,
  requireRole('owner', 'admin', 'member'),
  deleteSecret
);

export default router;

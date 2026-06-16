import { Router } from 'express';
import {
  create,
  getByProject,
  getById,
} from '../controllers/environmentController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/rbac.js';
import validateBody from '../middleware/validate.js';

const router = Router();

router.post(
  '/:workspaceId/environments/:projectId',
  protect,
  requireRole('owner', 'admin', 'member'),
  validateBody([
    { field: 'name', type: 'string', message: 'Environment name is required' },
  ]),
  create
);

router.get(
  '/:workspaceId/environments/:projectId',
  protect,
  requireRole('owner', 'admin', 'member', 'viewer'),
  getByProject
);

router.get(
  '/:workspaceId/environments/:projectId/:envId',
  protect,
  requireRole('owner', 'admin', 'member', 'viewer'),
  getById
);

export default router;

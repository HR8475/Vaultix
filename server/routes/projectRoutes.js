import { Router } from 'express';
import {
  create,
  getByWorkspace,
  getById,
} from '../controllers/projectController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/rbac.js';
import validateBody from '../middleware/validate.js';

const router = Router();

router.post(
  '/:workspaceId/projects',
  protect,
  requireRole('owner', 'admin', 'member'),
  validateBody([
    { field: 'name', type: 'string', message: 'Project name is required' },
  ]),
  create
);

router.get(
  '/:workspaceId/projects',
  protect,
  requireRole('owner', 'admin', 'member', 'viewer'),
  getByWorkspace
);

router.get(
  '/:workspaceId/projects/:projectId',
  protect,
  requireRole('owner', 'admin', 'member', 'viewer'),
  getById
);

export default router;

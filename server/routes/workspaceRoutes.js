import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  addMember,
  updateMemberRole,
  removeMember,
  getAuditLogs,
  update,
} from '../controllers/workspaceController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/rbac.js';
import validateBody from '../middleware/validate.js';

const router = Router();

router.post(
  '/',
  protect,
  validateBody([{ field: 'name', type: 'string', message: 'Name is required' }]),
  create
);

router.get('/', protect, getAll);

router.get(
  '/:workspaceId',
  protect,
  requireRole('owner', 'admin', 'member', 'viewer'),
  getById
);

router.get(
  '/:workspaceId/audit',
  protect,
  requireRole('owner', 'admin', 'member', 'viewer'),
  getAuditLogs
);

router.patch(
  '/:workspaceId',
  protect,
  requireRole('owner', 'admin'),
  update
);

router.post(
  '/:workspaceId/members',
  protect,
  requireRole('owner', 'admin'),
  validateBody([
    { field: 'email', type: 'string', message: 'Email is required' },
  ]),
  addMember
);

router.patch(
  '/:workspaceId/members/:userId',
  protect,
  requireRole('owner'),
  validateBody([
    { field: 'role', type: 'string', message: 'Role is required' },
  ]),
  updateMemberRole
);

router.delete(
  '/:workspaceId/members/:userId',
  protect,
  requireRole('owner', 'admin'),
  removeMember
);

export default router;

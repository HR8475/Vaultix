import { Router } from 'express';
import { signup, login, logout, getMe, refreshSession, getSessions, revokeSession } from '../controllers/authController.js';
import { validateKey } from '../controllers/apiKeyController.js';
import protect from '../middleware/auth.js';
import validateBody from '../middleware/validate.js';

const router = Router();

router.post(
  '/signup',
  validateBody([
    { field: 'name', type: 'string', message: 'Name is required' },
    { field: 'email', type: 'string', message: 'Email is required' },
    { field: 'password', type: 'string', message: 'Password is required' },
  ]),
  signup
);

router.post(
  '/login',
  validateBody([
    { field: 'email', type: 'string', message: 'Email is required' },
    { field: 'password', type: 'string', message: 'Password is required' },
  ]),
  login
);

router.post(
  '/api-key',
  validateBody([
    { field: 'apiKey', type: 'string', message: 'API key is required' },
  ]),
  validateKey
);

router.post('/refresh', refreshSession);

router.post('/logout', protect, logout);

router.get('/me', protect, getMe);

router.get('/sessions', protect, getSessions);

router.delete('/sessions/:id', protect, revokeSession);

export default router;

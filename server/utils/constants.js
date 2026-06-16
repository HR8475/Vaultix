import config from '../config/index.js';

/** Workspace member roles. */
export const ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
});

/** Audit log action identifiers. */
export const AUDIT_ACTIONS = Object.freeze({
  USER_SIGNUP: 'user.signup',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  WORKSPACE_CREATE: 'workspace.create',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_ADD_MEMBER: 'workspace.addMember',
  WORKSPACE_REMOVE_MEMBER: 'workspace.removeMember',
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  ENVIRONMENT_CREATE: 'environment.create',
  ENVIRONMENT_UPDATE: 'environment.update',
  ENVIRONMENT_DELETE: 'environment.delete',
  SECRET_CREATE: 'secret.create',
  SECRET_UPDATE: 'secret.update',
  SECRET_DELETE: 'secret.delete',
  SECRET_READ: 'secret.read',
  SECRET_ACCESS: 'secret.access',
  SECRET_EXPIRE: 'secret.expire',
  KEY_ROTATE: 'key.rotate',
  SESSION_REFRESH: 'session.refresh',
  SESSION_REVOKE: 'session.revoke',
});

/** JWT token expiry. */
export const JWT_EXPIRY = config.jwtExpiry;

/** Refresh token expiry. */
export const REFRESH_TOKEN_EXPIRY = config.refreshTokenExpiry;

/**
 * Default cookie options for setting httpOnly secure cookies.
 */
export const COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'strict' : 'lax',
  maxAge: 15 * 60 * 1000, // 15 min — access token cookie
  path: '/',
});

/**
 * Refresh token cookie options — longer lived.
 */
export const REFRESH_COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
});

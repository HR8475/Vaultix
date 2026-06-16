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
});

/** JWT token expiry. */
export const JWT_EXPIRY = '7d';

/**
 * Default cookie options for setting httpOnly secure cookies.
 * sameSite is set to 'none' so cross-origin credentialed requests work during
 * development (front-end on a different port). In production this should be
 * paired with `secure: true`.
 */
export const COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
});

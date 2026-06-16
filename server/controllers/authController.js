import authService from '../services/authService.js';
import auditService from '../services/auditService.js';
import { AUDIT_ACTIONS, COOKIE_OPTIONS } from '../utils/constants.js';

/**
 * POST /api/v1/auth/signup
 * Register a new user account.
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.signup({ name, email, password });

    res.cookie('token', token, COOKIE_OPTIONS);

    // Fire-and-forget audit log
    auditService.logAction({
      userId: user._id,
      action: AUDIT_ACTIONS.USER_SIGNUP,
      entity: 'User',
      entityId: user._id,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticate and receive a JWT.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });

    res.cookie('token', token, COOKIE_OPTIONS);

    auditService.logAction({
      userId: user._id,
      action: AUDIT_ACTIONS.USER_LOGIN,
      entity: 'User',
      entityId: user._id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: { user, token },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 * Clear the auth cookie.
 */
export const logout = async (req, res, next) => {
  try {
    auditService.logAction({
      userId: req.user._id,
      action: AUDIT_ACTIONS.USER_LOGOUT,
      entity: 'User',
      entityId: req.user._id,
      ipAddress: req.ip,
    });

    res.clearCookie('token', { path: '/' });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 * Return the currently authenticated user.
 */
export const getMe = async (req, res, _next) => {
  return res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

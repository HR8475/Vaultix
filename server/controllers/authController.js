import authService from '../services/authService.js';
import auditService from '../services/auditService.js';
import RefreshToken from '../models/RefreshToken.js';
import { AUDIT_ACTIONS, COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from '../utils/constants.js';

const getClientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

/**
 * POST /api/v1/auth/signup
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const { user, accessToken, refreshToken } = await authService.signup({
      name, email, password, ipAddress, userAgent
    });

    res.cookie('token', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    auditService.logAction({
      userId: user._id,
      action: AUDIT_ACTIONS.USER_SIGNUP,
      entity: 'User',
      entityId: user._id,
      ipAddress,
      userAgent,
    });

    return res.status(201).json({
      success: true,
      data: { user, token: accessToken },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const { user, accessToken, refreshToken } = await authService.login({
      email, password, ipAddress, userAgent
    });

    res.cookie('token', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    auditService.logAction({
      userId: user._id,
      action: AUDIT_ACTIONS.USER_LOGIN,
      entity: 'User',
      entityId: user._id,
      ipAddress,
      userAgent,
    });

    return res.status(200).json({
      success: true,
      data: { user, token: accessToken },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
export const refreshSession = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const { user, accessToken, refreshToken } = await authService.refreshSession({
      token, ipAddress, userAgent
    });

    res.cookie('token', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    auditService.logAction({
      userId: user._id,
      action: AUDIT_ACTIONS.SESSION_REFRESH,
      entity: 'User',
      entityId: user._id,
      ipAddress,
      userAgent,
    });

    return res.status(200).json({
      success: true,
      data: { token: accessToken },
    });
  } catch (err) {
    // Clear cookies on error
    res.clearCookie('token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const ipAddress = getClientIp(req);

    if (token) {
      await authService.revokeToken(token);
    }

    auditService.logAction({
      userId: req.user._id,
      action: AUDIT_ACTIONS.USER_LOGOUT,
      entity: 'User',
      entityId: req.user._id,
      ipAddress,
    });

    res.clearCookie('token', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });

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
 */
export const getMe = async (req, res, _next) => {
  return res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

/**
 * GET /api/v1/auth/sessions
 */
export const getSessions = async (req, res, next) => {
  try {
    const sessions = await RefreshToken.find({
      user: req.user._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).select('-token -family').sort({ updatedAt: -1 });

    const currentToken = req.cookies?.refreshToken;

    // Optional: mark which session is current if we had a way to cleanly hash the token.
    // For simplicity, returning the list.

    return res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/auth/sessions/:id
 */
export const revokeSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    
    const session = await RefreshToken.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.isRevoked = true;
    await session.save();

    auditService.logAction({
      userId: req.user._id,
      action: AUDIT_ACTIONS.SESSION_REVOKE,
      entity: 'RefreshToken',
      entityId: session._id,
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (err) {
    next(err);
  }
};

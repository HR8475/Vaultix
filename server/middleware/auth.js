import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import apiKeyService from '../services/apiKeyService.js';
import auditService from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../utils/constants.js';

/**
 * Protect routes — verify JWT or API key from Authorization header or cookie,
 * then attach the authenticated user to `req.user`.
 *
 * Sets `req.authMethod` to 'jwt' or 'apikey'.
 * If API key auth, also sets `req.apiKey` to the ApiKey document.
 */
const protect = async (req, _res, next) => {
  try {
    let token;

    // 1. Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw ApiError.unauthorized('Not authenticated — token missing');
    }

    // 3. Determine auth method: API key or JWT
    if (token.startsWith(apiKeyService.KEY_PREFIX)) {
      // ── API Key Authentication ──
      const apiKey = await apiKeyService.validateApiKey(token);

      // Update last-used tracking (fire-and-forget)
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
      apiKeyService.updateLastUsed(apiKey._id, clientIp);

      // Log API key usage (fire-and-forget)
      auditService.logAction({
        userId: apiKey.user._id,
        workspaceId: apiKey.workspace._id || apiKey.workspace,
        action: AUDIT_ACTIONS.APIKEY_USE,
        entity: 'ApiKey',
        entityId: apiKey._id,
        metadata: { keyName: apiKey.name, keyPrefix: apiKey.keyPrefix },
        ipAddress: clientIp,
      });

      req.user = apiKey.user;
      req.apiKey = apiKey;
      req.authMethod = 'apikey';
      return next();
    }

    // ── JWT Authentication (existing flow) ──
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      throw ApiError.unauthorized('User belonging to this token no longer exists');
    }

    req.user = user;
    req.authMethod = 'jwt';
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Invalid or expired token'));
    }
    next(err);
  }
};

export default protect;

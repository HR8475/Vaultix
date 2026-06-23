import apiKeyService from '../services/apiKeyService.js';
import auditService from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../utils/constants.js';

const getClientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

/**
 * POST /api/v1/workspaces/:workspaceId/api-keys
 * Create a new API key. Returns the plaintext key exactly once.
 */
export const createKey = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name, projectId, environmentId, permissions, expiresAt } = req.body;

    const { apiKey, plaintextKey } = await apiKeyService.createApiKey({
      name,
      userId: req.user._id,
      workspaceId,
      projectId,
      environmentId,
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Audit log
    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.APIKEY_CREATE,
      entity: 'ApiKey',
      entityId: apiKey._id,
      metadata: { keyName: name, keyPrefix: apiKey.keyPrefix },
      ipAddress: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      data: {
        apiKey: {
          _id: apiKey._id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          workspace: apiKey.workspace,
          project: apiKey.project,
          environment: apiKey.environment,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
        // The plaintext key — shown ONLY in this response
        plaintextKey,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId/api-keys
 * List all API keys for a workspace (metadata only).
 */
export const listKeys = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const keys = await apiKeyService.listKeys(workspaceId);

    return res.status(200).json({
      success: true,
      data: { keys },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId/api-keys/:keyId
 * Get a single API key's details.
 */
export const getKey = async (req, res, next) => {
  try {
    const { workspaceId, keyId } = req.params;
    const apiKey = await apiKeyService.getKeyById(keyId, workspaceId);

    return res.status(200).json({
      success: true,
      data: { apiKey },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/workspaces/:workspaceId/api-keys/:keyId
 * Revoke an API key.
 */
export const revokeKey = async (req, res, next) => {
  try {
    const { workspaceId, keyId } = req.params;
    const apiKey = await apiKeyService.revokeKey(keyId, req.user._id);

    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.APIKEY_REVOKE,
      entity: 'ApiKey',
      entityId: apiKey._id,
      metadata: { keyName: apiKey.name, keyPrefix: apiKey.keyPrefix },
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/workspaces/:workspaceId/api-keys/:keyId/rotate
 * Rotate an API key (revoke old, issue new).
 */
export const rotateKey = async (req, res, next) => {
  try {
    const { workspaceId, keyId } = req.params;
    const { apiKey, plaintextKey } = await apiKeyService.rotateKey(keyId, req.user._id);

    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.APIKEY_ROTATE,
      entity: 'ApiKey',
      entityId: apiKey._id,
      metadata: { keyName: apiKey.name, keyPrefix: apiKey.keyPrefix, oldKeyId: keyId },
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      data: {
        apiKey: {
          _id: apiKey._id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          workspace: apiKey.workspace,
          project: apiKey.project,
          environment: apiKey.environment,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
        plaintextKey,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/api-key
 * Validate an API key (used by CLI `vaultix auth`).
 * Returns workspace/user info on success.
 */
export const validateKey = async (req, res, next) => {
  try {
    const { apiKey: plaintextKey } = req.body;

    if (!plaintextKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required',
      });
    }

    const apiKey = await apiKeyService.validateApiKey(plaintextKey);

    // Update last used
    const clientIp = getClientIp(req);
    apiKeyService.updateLastUsed(apiKey._id, clientIp);

    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          _id: apiKey.user._id,
          name: apiKey.user.name,
          email: apiKey.user.email,
        },
        workspace: {
          _id: apiKey.workspace._id,
          name: apiKey.workspace.name,
          slug: apiKey.workspace.slug,
        },
        keyName: apiKey.name,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

import Secret from '../models/Secret.js';
import Project from '../models/Project.js';
import Environment from '../models/Environment.js';
import * as encryptionService from '../services/encryptionService.js';
import auditService from '../services/auditService.js';
import ApiError from '../utils/ApiError.js';
import { AUDIT_ACTIONS } from '../utils/constants.js';

/**
 * Helper to verify that the project belongs to the workspace,
 * and the environment belongs to the project.
 */
const verifyHierarchy = async (workspaceId, projectId, envId) => {
  const project = await Project.findOne({ _id: projectId, workspace: workspaceId });
  if (!project) {
    throw ApiError.notFound('Project not found in this workspace');
  }
  const environment = await Environment.findOne({ _id: envId, project: projectId });
  if (!environment) {
    throw ApiError.notFound('Environment not found in this project');
  }
  return { project, environment };
};

/**
 * GET /api/v1/workspaces/:workspaceId/environments/:projectId/:envId/secrets
 * List all secrets in an environment. Mask values and send only the latest version meta.
 */
export const getSecrets = async (req, res, next) => {
  try {
    const { workspaceId, projectId, envId } = req.params;
    const { search } = req.query;

    await verifyHierarchy(workspaceId, projectId, envId);

    const query = {
      workspace: workspaceId,
      project: projectId,
      environment: envId,
    };

    if (search) {
      query.key = { $regex: search, $options: 'i' };
    }

    const secrets = await Secret.find(query).sort({ key: 1 });

    // Format secrets: mask the value and return latest version info
    const formattedSecrets = secrets.map((secret) => {
      const latestVersion = secret.versions.reduce((latest, current) => {
        return current.version > latest.version ? current : latest;
      }, secret.versions[0]);

      return {
        _id: secret._id,
        key: secret.key,
        workspace: secret.workspace,
        project: secret.project,
        environment: secret.environment,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
        version: latestVersion ? latestVersion.version : 1,
        value: '********', // Masked by default
        createdBy: latestVersion ? latestVersion.createdBy : null,
        updatedBy: latestVersion ? latestVersion.createdBy : null, // tracking last modifier
        versionCount: secret.versions.length,
      };
    });

    return res.status(200).json({ success: true, data: { secrets: formattedSecrets } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId/environments/:projectId/:envId/secrets/:secretId/reveal
 * Decrypt and return the latest version of a secret. Log action in AuditLog.
 */
export const revealSecret = async (req, res, next) => {
  try {
    const { workspaceId, projectId, envId, secretId } = req.params;

    await verifyHierarchy(workspaceId, projectId, envId);

    const secret = await Secret.findOne({
      _id: secretId,
      workspace: workspaceId,
      project: projectId,
      environment: envId,
    });

    if (!secret) {
      throw ApiError.notFound('Secret not found');
    }

    const latestVersion = secret.versions.reduce((latest, current) => {
      return current.version > latest.version ? current : latest;
    }, secret.versions[0]);

    if (!latestVersion) {
      throw ApiError.badRequest('Secret has no versions');
    }

    const plaintext = encryptionService.decrypt(latestVersion.value);

    // Audit Log
    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.SECRET_READ,
      entity: 'Secret',
      entityId: secret._id,
      metadata: { key: secret.key, projectId, envId, version: latestVersion.version },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: secret._id,
        key: secret.key,
        plaintext,
        version: latestVersion.version,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/workspaces/:workspaceId/environments/:projectId/:envId/secrets
 * Create a new encrypted secret. Check for duplicates first.
 */
export const createSecret = async (req, res, next) => {
  try {
    const { workspaceId, projectId, envId } = req.params;
    const { key, value } = req.body;

    if (!key || !value) {
      throw ApiError.badRequest('Key and Value are required');
    }

    const cleanKey = key.trim().toUpperCase();

    await verifyHierarchy(workspaceId, projectId, envId);

    // Check for duplicate key in this environment
    const existingSecret = await Secret.findOne({
      environment: envId,
      key: cleanKey,
    });

    if (existingSecret) {
      throw ApiError.badRequest(`Secret with key "${cleanKey}" already exists in this environment`);
    }

    const encryptedValue = encryptionService.encrypt(value);

    const secret = await Secret.create({
      workspace: workspaceId,
      project: projectId,
      environment: envId,
      key: cleanKey,
      versions: [
        {
          version: 1,
          value: encryptedValue,
          createdBy: req.user._id,
        },
      ],
    });

    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.SECRET_CREATE,
      entity: 'Secret',
      entityId: secret._id,
      metadata: { key: cleanKey, projectId, envId },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: {
        secret: {
          _id: secret._id,
          key: secret.key,
          version: 1,
          value: '********',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/workspaces/:workspaceId/environments/:projectId/:envId/secrets/:secretId
 * Update an existing secret. Appends a new version to versions array.
 */
export const updateSecret = async (req, res, next) => {
  try {
    const { workspaceId, projectId, envId, secretId } = req.params;
    const { value } = req.body;

    if (!value) {
      throw ApiError.badRequest('Value is required');
    }

    await verifyHierarchy(workspaceId, projectId, envId);

    const secret = await Secret.findOne({
      _id: secretId,
      workspace: workspaceId,
      project: projectId,
      environment: envId,
    });

    if (!secret) {
      throw ApiError.notFound('Secret not found');
    }

    const encryptedValue = encryptionService.encrypt(value);
    const nextVersion = secret.versions.length + 1;

    secret.versions.push({
      version: nextVersion,
      value: encryptedValue,
      createdBy: req.user._id,
      createdAt: new Date(),
    });

    await secret.save();

    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.SECRET_UPDATE,
      entity: 'Secret',
      entityId: secret._id,
      metadata: { key: secret.key, projectId, envId, version: nextVersion },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: {
        secret: {
          _id: secret._id,
          key: secret.key,
          version: nextVersion,
          value: '********',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/workspaces/:workspaceId/environments/:projectId/:envId/secrets/:secretId
 * Delete a secret.
 */
export const deleteSecret = async (req, res, next) => {
  try {
    const { workspaceId, projectId, envId, secretId } = req.params;

    await verifyHierarchy(workspaceId, projectId, envId);

    const secret = await Secret.findOne({
      _id: secretId,
      workspace: workspaceId,
      project: projectId,
      environment: envId,
    });

    if (!secret) {
      throw ApiError.notFound('Secret not found');
    }

    await secret.deleteOne();

    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.SECRET_DELETE,
      entity: 'Secret',
      entityId: secret._id,
      metadata: { key: secret.key, projectId, envId },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Secret deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/workspaces/:workspaceId/environments/:projectId/:envId/secrets/import
 * Bulk import secrets from a raw string of env-formatted variables (e.g. KEY=VALUE)
 */
export const bulkImport = async (req, res, next) => {
  try {
    const { workspaceId, projectId, envId } = req.params;
    const { envString } = req.body;

    if (!envString || typeof envString !== 'string') {
      throw ApiError.badRequest('Env string is required');
    }

    await verifyHierarchy(workspaceId, projectId, envId);

    // Parse environment string
    const lines = envString.split('\n');
    const importedSecrets = [];

    for (const line of lines) {
      // Ignore comments and empty lines
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }

      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match) {
        continue;
      }

      const key = match[1].trim().toUpperCase();
      let value = match[2] ? match[2].trim() : '';

      // Unwrap quotes if any
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Check if key already exists in this environment
      let secret = await Secret.findOne({
        environment: envId,
        key,
      });

      const encryptedValue = encryptionService.encrypt(value);

      if (secret) {
        // Appending new version
        const nextVersion = secret.versions.length + 1;
        secret.versions.push({
          version: nextVersion,
          value: encryptedValue,
          createdBy: req.user._id,
          createdAt: new Date(),
        });
        await secret.save();

        auditService.logAction({
          userId: req.user._id,
          workspaceId,
          action: AUDIT_ACTIONS.SECRET_UPDATE,
          entity: 'Secret',
          entityId: secret._id,
          metadata: { key, projectId, envId, version: nextVersion, isBulk: true },
          ipAddress: req.ip,
        });

        importedSecrets.push({
          _id: secret._id,
          key,
          version: nextVersion,
          status: 'updated',
        });
      } else {
        // Creating new secret
        secret = await Secret.create({
          workspace: workspaceId,
          project: projectId,
          environment: envId,
          key,
          versions: [
            {
              version: 1,
              value: encryptedValue,
              createdBy: req.user._id,
            },
          ],
        });

        auditService.logAction({
          userId: req.user._id,
          workspaceId,
          action: AUDIT_ACTIONS.SECRET_CREATE,
          entity: 'Secret',
          entityId: secret._id,
          metadata: { key, projectId, envId, isBulk: true },
          ipAddress: req.ip,
        });

        importedSecrets.push({
          _id: secret._id,
          key,
          version: 1,
          status: 'created',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${importedSecrets.length} secret(s)`,
      data: { secrets: importedSecrets },
    });
  } catch (err) {
    next(err);
  }
};

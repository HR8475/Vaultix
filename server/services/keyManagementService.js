import crypto from 'crypto';
import Workspace from '../models/Workspace.js';
import Secret from '../models/Secret.js';
import config from '../config/index.js';
import * as encryptionService from './encryptionService.js';
import logger from '../utils/logger.js';

/**
 * In a real production system, you would store encrypted workspace keys 
 * in a KMS (Key Management Service) like AWS KMS or HashiCorp Vault.
 * For this implementation, we will derive a per-workspace key 
 * on the fly using PBKDF2 with the global ENCRYPTION_KEY as the secret
 * and the workspace ID + encryptionKeyId as the salt.
 */

/**
 * Derive a 32-byte workspace-specific encryption key.
 * @param {string} workspaceId 
 * @param {string} keyId 
 * @returns {Buffer} 32-byte key buffer
 */
export const deriveWorkspaceKey = (workspaceId, keyId) => {
  if (keyId === 'default' || !keyId) {
    // Fall back to global key
    return Buffer.from(config.encryptionKey, 'hex');
  }

  // Derive a unique 32-byte key using PBKDF2
  const salt = `${workspaceId}:${keyId}`;
  const masterKey = config.encryptionKey;
  
  // 100,000 iterations is a reasonable baseline for PBKDF2
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
};

/**
 * Gets the current encryption key buffer for a workspace.
 */
export const getWorkspaceKey = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId).select('encryptionKeyId');
  if (!workspace) throw new Error('Workspace not found');
  
  return deriveWorkspaceKey(workspaceId, workspace.encryptionKeyId);
};

/**
 * Rotate the encryption key for a workspace.
 * Decrypts all existing secrets with the old key, and re-encrypts with a new key.
 */
export const rotateWorkspaceKey = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new Error('Workspace not found');

  const oldKeyId = workspace.encryptionKeyId;
  const oldKeyBuffer = deriveWorkspaceKey(workspaceId, oldKeyId);

  // Generate new key ID
  const newKeyId = crypto.randomUUID();
  const newKeyBuffer = deriveWorkspaceKey(workspaceId, newKeyId);

  // Fetch all secrets for this workspace
  const secrets = await Secret.find({ workspace: workspaceId });

  let successCount = 0;
  let failCount = 0;

  for (const secret of secrets) {
    try {
      // We must re-encrypt ALL versions of the secret
      const updatedVersions = secret.versions.map((v) => {
        const plaintext = encryptionService.decrypt(v.value, oldKeyBuffer);
        const reEncrypted = encryptionService.encrypt(plaintext, newKeyBuffer);
        return {
          ...v.toObject(),
          value: reEncrypted,
        };
      });

      secret.versions = updatedVersions;
      await secret.save();
      successCount++;
    } catch (err) {
      logger.error(`Failed to rotate key for secret ${secret._id}:`, err);
      failCount++;
    }
  }

  // If we had any failures, we probably shouldn't commit the workspace key change 
  // because the failed secrets would become unreadable. In a real system, use transactions.
  if (failCount === 0) {
    workspace.encryptionKeyId = newKeyId;
    workspace.keyRotatedAt = new Date();
    await workspace.save();
    logger.info(`Rotated key for workspace ${workspaceId}. Re-encrypted ${successCount} secrets.`);
  } else {
    throw new Error(`Key rotation failed. ${failCount} secrets could not be re-encrypted. Rotation aborted.`);
  }

  return { successCount };
};

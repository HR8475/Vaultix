import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';
import ApiError from '../utils/ApiError.js';

const KEY_PREFIX = 'vx_live_';
const KEY_RANDOM_BYTES = 32; // 32 bytes = 64 hex chars

/**
 * Generate a new plaintext API key with the `vx_live_` prefix.
 * @returns {string} Full plaintext API key
 */
const generateKey = () => {
  const randomPart = crypto.randomBytes(KEY_RANDOM_BYTES).toString('hex');
  return `${KEY_PREFIX}${randomPart}`;
};

/**
 * SHA-256 hash a plaintext API key for storage.
 * @param {string} plaintext — The full API key string
 * @returns {string} Hex-encoded SHA-256 hash
 */
const hashKey = (plaintext) => {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
};

/**
 * Create a new API key. Returns the plaintext key ONCE — it is never stored.
 *
 * @param {object}  params
 * @param {string}  params.name          — Human-readable key name
 * @param {string}  params.userId        — Creator's user ID
 * @param {string}  params.workspaceId   — Workspace scope
 * @param {string}  [params.projectId]   — Optional project scope
 * @param {string}  [params.environmentId] — Optional environment scope
 * @param {string[]} [params.permissions] — Array of permission strings
 * @param {Date}    [params.expiresAt]   — Optional expiry date
 * @returns {Promise<{apiKey: object, plaintextKey: string}>}
 */
const createApiKey = async ({
  name,
  userId,
  workspaceId,
  projectId,
  environmentId,
  permissions,
  expiresAt,
}) => {
  const plaintextKey = generateKey();
  const keyHash = hashKey(plaintextKey);
  const keyPrefix = plaintextKey.substring(0, 12); // e.g. "vx_live_abcd"

  const apiKey = await ApiKey.create({
    name,
    keyHash,
    keyPrefix,
    user: userId,
    workspace: workspaceId,
    project: projectId || null,
    environment: environmentId || null,
    permissions: permissions || ['secrets.read', 'env.pull'],
    expiresAt: expiresAt || null,
  });

  return { apiKey, plaintextKey };
};

/**
 * Validate an API key. Hashes the plaintext, looks up the record,
 * and verifies it's not revoked or expired.
 *
 * @param {string} plaintextKey — The full `vx_live_...` key
 * @returns {Promise<object>} The ApiKey document with populated refs
 * @throws {ApiError} If key is invalid, revoked, or expired
 */
const validateApiKey = async (plaintextKey) => {
  if (!plaintextKey || !plaintextKey.startsWith(KEY_PREFIX)) {
    throw ApiError.unauthorized('Invalid API key format');
  }

  const keyHash = hashKey(plaintextKey);

  const apiKey = await ApiKey.findOne({ keyHash })
    .populate('user', 'name email')
    .populate('workspace', 'name slug');

  if (!apiKey) {
    throw ApiError.unauthorized('Invalid API key');
  }

  if (apiKey.isRevoked) {
    throw ApiError.unauthorized('API key has been revoked');
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    throw ApiError.unauthorized('API key has expired');
  }

  return apiKey;
};

/**
 * Revoke an API key.
 *
 * @param {string} keyId  — The ApiKey document ID
 * @param {string} userId — The user performing the revocation
 * @returns {Promise<object>} The revoked ApiKey document
 */
const revokeKey = async (keyId, userId) => {
  const apiKey = await ApiKey.findOne({ _id: keyId, user: userId });

  if (!apiKey) {
    throw ApiError.notFound('API key not found');
  }

  if (apiKey.isRevoked) {
    throw ApiError.badRequest('API key is already revoked');
  }

  apiKey.isRevoked = true;
  apiKey.revokedAt = new Date();
  await apiKey.save();

  return apiKey;
};

/**
 * Rotate an API key: revoke the old one and create a new one
 * with the same scope and permissions.
 *
 * @param {string} keyId  — The ApiKey document ID to rotate
 * @param {string} userId — The user performing the rotation
 * @returns {Promise<{apiKey: object, plaintextKey: string}>}
 */
const rotateKey = async (keyId, userId) => {
  const oldKey = await ApiKey.findOne({ _id: keyId, user: userId });

  if (!oldKey) {
    throw ApiError.notFound('API key not found');
  }

  if (oldKey.isRevoked) {
    throw ApiError.badRequest('Cannot rotate a revoked API key');
  }

  // Revoke the old key
  oldKey.isRevoked = true;
  oldKey.revokedAt = new Date();
  await oldKey.save();

  // Create a new key with the same scope and permissions
  const result = await createApiKey({
    name: oldKey.name,
    userId,
    workspaceId: oldKey.workspace,
    projectId: oldKey.project,
    environmentId: oldKey.environment,
    permissions: oldKey.permissions,
    expiresAt: oldKey.expiresAt,
  });

  return result;
};

/**
 * Update the last-used timestamp and IP on an API key.
 * Fire-and-forget — errors are swallowed.
 *
 * @param {string} keyId — The ApiKey document ID
 * @param {string} ip    — Requester IP address
 */
const updateLastUsed = async (keyId, ip) => {
  try {
    await ApiKey.findByIdAndUpdate(keyId, {
      lastUsedAt: new Date(),
      lastUsedIp: ip,
    });
  } catch {
    // Silently ignore — usage tracking should never crash requests
  }
};

/**
 * List all API keys for a workspace (returns metadata only, no hashes).
 *
 * @param {string} workspaceId — Workspace ID to filter by
 * @returns {Promise<object[]>} Array of ApiKey documents
 */
const listKeys = async (workspaceId) => {
  return ApiKey.find({ workspace: workspaceId })
    .select('-keyHash')
    .populate('user', 'name email')
    .populate('project', 'name')
    .populate('environment', 'name')
    .sort({ createdAt: -1 });
};

/**
 * Get a single API key by ID.
 *
 * @param {string} keyId       — The ApiKey document ID
 * @param {string} workspaceId — Workspace ID for authorization check
 * @returns {Promise<object>} ApiKey document
 */
const getKeyById = async (keyId, workspaceId) => {
  const apiKey = await ApiKey.findOne({ _id: keyId, workspace: workspaceId })
    .select('-keyHash')
    .populate('user', 'name email')
    .populate('project', 'name')
    .populate('environment', 'name');

  if (!apiKey) {
    throw ApiError.notFound('API key not found');
  }

  return apiKey;
};

export default {
  generateKey,
  hashKey,
  createApiKey,
  validateApiKey,
  revokeKey,
  rotateKey,
  updateLastUsed,
  listKeys,
  getKeyById,
  KEY_PREFIX,
};

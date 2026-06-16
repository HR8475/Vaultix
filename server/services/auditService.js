import AuditLog from '../models/AuditLog.js';

/**
 * Persist an audit-log entry.
 * Designed to be called fire-and-forget (no need to await in controllers).
 *
 * @param {object}  params
 * @param {string}  params.userId      - Acting user's ObjectId.
 * @param {string}  [params.workspaceId] - Related workspace ObjectId.
 * @param {string}  params.action      - One of the AUDIT_ACTIONS values.
 * @param {string}  [params.entity]    - Model name, e.g. 'User'.
 * @param {string}  [params.entityId]  - ObjectId of the affected document.
 * @param {object}  [params.metadata]  - Arbitrary extra data.
 * @param {string}  [params.ipAddress] - Requester's IP address.
 * @returns {Promise<void>}
 */
const logAction = async ({
  userId,
  workspaceId,
  action,
  entity,
  entityId,
  metadata,
  ipAddress,
}) => {
  try {
    await AuditLog.create({
      user: userId,
      workspace: workspaceId,
      action,
      entity,
      entityId,
      metadata,
      ipAddress,
    });
  } catch (err) {
    // Audit logging should never crash the request — log and move on.
    console.error('Audit log error:', err.message);
  }
};

export default { logAction };

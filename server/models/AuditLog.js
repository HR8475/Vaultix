import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    index: true,
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'user.signup',
      'user.login',
      'user.logout',
      'workspace.create',
      'workspace.update',
      'workspace.addMember',
      'workspace.removeMember',
      'project.create',
      'project.update',
      'project.delete',
      'environment.create',
      'environment.update',
      'environment.delete',
      'secret.create',
      'secret.update',
      'secret.delete',
      'secret.read',
      'secret.access',
      'secret.expire',
      'key.rotate',
      'session.refresh',
      'session.revoke',
    ],
  },
  entity: {
    type: String, // model name, e.g. 'User', 'Workspace'
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  source: {
    type: String, // 'web', 'cli', 'api'
    default: 'api',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

/** Compound index for efficient workspace-scoped timeline queries. */
auditLogSchema.index({ workspace: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

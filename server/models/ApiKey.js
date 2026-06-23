import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema(
  {
    /** Human-readable name for identifying this key */
    name: {
      type: String,
      required: [true, 'API key name is required'],
      trim: true,
      maxlength: [100, 'Key name cannot exceed 100 characters'],
    },

    /** SHA-256 hash of the full API key — never store plaintext */
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /** First 12 chars of the key for display purposes (e.g. vx_live_abcd) */
    keyPrefix: {
      type: String,
      required: true,
    },

    /** The user who created this API key */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /** Workspace scope — every key is scoped to at least one workspace */
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },

    /** Optional: narrow scope to a specific project */
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    /** Optional: narrow scope to a specific environment */
    environment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Environment',
      default: null,
    },

    /** Granted permissions */
    permissions: {
      type: [String],
      enum: ['secrets.read', 'secrets.write', 'env.pull'],
      default: ['secrets.read', 'env.pull'],
    },

    /** Optional expiry date — null means never expires */
    expiresAt: {
      type: Date,
      default: null,
    },

    /** Timestamp of last successful use */
    lastUsedAt: {
      type: Date,
      default: null,
    },

    /** IP address from the last use */
    lastUsedIp: {
      type: String,
      default: null,
    },

    /** Whether this key has been revoked */
    isRevoked: {
      type: Boolean,
      default: false,
    },

    /** When the key was revoked */
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/** Compound index for efficient workspace-scoped queries */
apiKeySchema.index({ workspace: 1, isRevoked: 1, createdAt: -1 });

/** Virtual to check if key is expired */
apiKeySchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

/** Virtual to get the current status */
apiKeySchema.virtual('status').get(function () {
  if (this.isRevoked) return 'revoked';
  if (this.isExpired) return 'expired';
  return 'active';
});

/** Ensure virtuals are included in JSON output */
apiKeySchema.set('toJSON', { virtuals: true });
apiKeySchema.set('toObject', { virtuals: true });

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;

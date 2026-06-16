import mongoose from 'mongoose';

const secretSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    environment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Environment',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: [true, 'Secret key is required'],
      trim: true,
      uppercase: true,
    },
    versions: [
      {
        version: {
          type: Number,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

/** Compound unique index — one key per environment. */
secretSchema.index({ environment: 1, key: 1 }, { unique: true });

const Secret = mongoose.model('Secret', secretSchema);
export default Secret;

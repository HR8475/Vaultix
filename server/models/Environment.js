import mongoose from 'mongoose';

const environmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Environment name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      lowercase: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

/** Compound unique index — one slug per project. */
environmentSchema.index({ project: 1, slug: 1 }, { unique: true });

const Environment = mongoose.model('Environment', environmentSchema);
export default Environment;

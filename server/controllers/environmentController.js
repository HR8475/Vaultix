import Environment from '../models/Environment.js';
import Project from '../models/Project.js';
import auditService from '../services/auditService.js';
import ApiError from '../utils/ApiError.js';
import { AUDIT_ACTIONS } from '../utils/constants.js';

/**
 * Utility — generate a URL-safe slug from a name.
 * @param {string} name
 * @returns {string}
 */
const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * POST /api/v1/workspaces/:workspaceId/environments/:projectId
 * Create a new environment inside a project.
 */
export const create = async (req, res, next) => {
  try {
    const { workspaceId, projectId } = req.params;
    const { name } = req.body;

    // Verify project belongs to workspace
    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    });
    if (!project) {
      throw ApiError.notFound('Project not found in this workspace');
    }

    const environment = await Environment.create({
      name,
      slug: slugify(name),
      project: projectId,
      createdBy: req.user._id,
    });

    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.ENVIRONMENT_CREATE,
      entity: 'Environment',
      entityId: environment._id,
      metadata: { projectId },
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: { environment } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId/environments/:projectId
 * List all environments in a project.
 */
export const getByProject = async (req, res, next) => {
  try {
    const { workspaceId, projectId } = req.params;

    // Verify project belongs to workspace
    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    });
    if (!project) {
      throw ApiError.notFound('Project not found in this workspace');
    }

    const environments = await Environment.find({ project: projectId });

    return res.status(200).json({ success: true, data: { environments } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId/environments/:projectId/:envId
 * Fetch a single environment.
 */
export const getById = async (req, res, next) => {
  try {
    const { workspaceId, projectId, envId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    });
    if (!project) {
      throw ApiError.notFound('Project not found in this workspace');
    }

    const environment = await Environment.findOne({
      _id: envId,
      project: projectId,
    });
    if (!environment) {
      throw ApiError.notFound('Environment not found');
    }

    return res.status(200).json({ success: true, data: { environment } });
  } catch (err) {
    next(err);
  }
};

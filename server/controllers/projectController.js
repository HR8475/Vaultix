import Project from '../models/Project.js';
import auditService from '../services/auditService.js';
import ApiError from '../utils/ApiError.js';
import { AUDIT_ACTIONS } from '../utils/constants.js';

/**
 * POST /api/v1/workspaces/:workspaceId/projects
 * Create a new project inside the workspace.
 */
export const create = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { workspaceId } = req.params;

    const project = await Project.create({
      name,
      description,
      workspace: workspaceId,
      createdBy: req.user._id,
    });

    auditService.logAction({
      userId: req.user._id,
      workspaceId,
      action: AUDIT_ACTIONS.PROJECT_CREATE,
      entity: 'Project',
      entityId: project._id,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId/projects
 * List all projects in a workspace.
 */
export const getByWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const projects = await Project.find({ workspace: workspaceId });

    return res.status(200).json({ success: true, data: { projects } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId/projects/:projectId
 * Fetch a single project, ensuring it belongs to the workspace.
 */
export const getById = async (req, res, next) => {
  try {
    const { workspaceId, projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    });

    if (!project) {
      throw ApiError.notFound('Project not found in this workspace');
    }

    return res.status(200).json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
};

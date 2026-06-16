import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import auditService from '../services/auditService.js';
import ApiError from '../utils/ApiError.js';
import { AUDIT_ACTIONS, ROLES } from '../utils/constants.js';

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
 * POST /api/v1/workspaces
 * Create a new workspace; the current user becomes the owner.
 */
export const create = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const workspace = await Workspace.create({
      name,
      slug: slugify(name),
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: ROLES.OWNER }],
    });

    auditService.logAction({
      userId: req.user._id,
      workspaceId: workspace._id,
      action: AUDIT_ACTIONS.WORKSPACE_CREATE,
      entity: 'Workspace',
      entityId: workspace._id,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: { workspace } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces
 * List all workspaces the current user belongs to.
 */
export const getAll = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id,
    });

    return res.status(200).json({ success: true, data: { workspaces } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId
 * Return a single workspace (already attached by RBAC middleware).
 */
export const getById = async (req, res, _next) => {
  await req.workspace.populate('members.user', 'name email');
  return res
    .status(200)
    .json({ success: true, data: { workspace: req.workspace } });
};

/**
 * POST /api/v1/workspaces/:workspaceId/members
 * Add a user to the workspace by email.
 */
export const addMember = async (req, res, next) => {
  try {
    const { email, role = ROLES.MEMBER } = req.body;

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      throw ApiError.notFound('No user found with that email');
    }

    const workspace = req.workspace;

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      throw ApiError.badRequest('User is already a member of this workspace');
    }

    workspace.members.push({ user: userToAdd._id, role });
    await workspace.save();

    auditService.logAction({
      userId: req.user._id,
      workspaceId: workspace._id,
      action: AUDIT_ACTIONS.WORKSPACE_ADD_MEMBER,
      entity: 'Workspace',
      entityId: workspace._id,
      metadata: { addedUserId: userToAdd._id, role },
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, data: { workspace } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/workspaces/:workspaceId/members/:userId
 * Update a member's role.
 */
export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    if (!Object.values(ROLES).includes(role)) {
      throw ApiError.badRequest('Invalid role');
    }

    const workspace = req.workspace;
    const member = workspace.members.find(
      (m) => m.user.toString() === userId
    );

    if (!member) {
      throw ApiError.notFound('Member not found in this workspace');
    }

    member.role = role;
    await workspace.save();

    auditService.logAction({
      userId: req.user._id,
      workspaceId: workspace._id,
      action: AUDIT_ACTIONS.WORKSPACE_UPDATE,
      entity: 'Workspace',
      entityId: workspace._id,
      metadata: { updatedUserId: userId, newRole: role },
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, data: { workspace } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/workspaces/:workspaceId/audit
 * Fetch audit logs for the workspace.
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const logs = await AuditLog.find({ workspace: workspaceId })
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: { logs },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/workspaces/:workspaceId
 * Update workspace details (e.g. name, description).
 */
export const update = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const workspace = req.workspace;

    if (name) {
      workspace.name = name;
      workspace.slug = slugify(name);
    }
    if (description !== undefined) {
      workspace.description = description;
    }

    await workspace.save();

    auditService.logAction({
      userId: req.user._id,
      workspaceId: workspace._id,
      action: AUDIT_ACTIONS.WORKSPACE_UPDATE,
      entity: 'Workspace',
      entityId: workspace._id,
      metadata: { name, description },
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, data: { workspace } });
  } catch (err) {
    next(err);
  }
};

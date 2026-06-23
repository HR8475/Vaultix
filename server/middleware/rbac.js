import Workspace from '../models/Workspace.js';
import ApiError from '../utils/ApiError.js';

/**
 * Permission mapping: maps RBAC roles to implicit API key permissions.
 * When an API key is used, we check its `permissions` array instead of roles.
 */
const ROUTE_PERMISSION_MAP = {
  // Routes that only need read access
  viewer: 'secrets.read',
  // Routes that need write access
  member: 'secrets.read',
};

/**
 * Role-based access control middleware factory.
 * Checks that the authenticated user is a member of the workspace
 * identified by `req.params.workspaceId` and holds one of the allowed roles.
 *
 * For API key auth, verifies scope (workspace/project/env) and permissions.
 *
 * On success, attaches the workspace document to `req.workspace`.
 *
 * @param {...string} roles - Allowed roles (e.g. 'owner', 'admin').
 * @returns {Function} Express middleware.
 */
const requireRole = (...roles) => {
  return async (req, _res, next) => {
    try {
      const { workspaceId } = req.params;

      if (!workspaceId) {
        throw ApiError.badRequest('Workspace ID is required');
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw ApiError.notFound('Workspace not found');
      }

      // ── API Key Authentication Path ──
      if (req.authMethod === 'apikey' && req.apiKey) {
        const apiKey = req.apiKey;

        // Verify workspace scope
        const apiKeyWorkspaceId = apiKey.workspace._id
          ? apiKey.workspace._id.toString()
          : apiKey.workspace.toString();

        if (apiKeyWorkspaceId !== workspaceId) {
          throw ApiError.forbidden(
            'API key does not have access to this workspace'
          );
        }

        // Verify project scope (if the key is scoped to a specific project)
        if (apiKey.project && req.params.projectId) {
          const apiKeyProjectId = apiKey.project._id
            ? apiKey.project._id.toString()
            : apiKey.project.toString();

          if (apiKeyProjectId !== req.params.projectId) {
            throw ApiError.forbidden(
              'API key does not have access to this project'
            );
          }
        }

        // Verify environment scope (if the key is scoped to a specific environment)
        if (apiKey.environment && req.params.envId) {
          const apiKeyEnvId = apiKey.environment._id
            ? apiKey.environment._id.toString()
            : apiKey.environment.toString();

          if (apiKeyEnvId !== req.params.envId) {
            throw ApiError.forbidden(
              'API key does not have access to this environment'
            );
          }
        }

        // Check permissions: if the route only allows 'viewer', the key needs 'secrets.read'.
        // If the route allows write roles (owner/admin/member), key needs appropriate write perms.
        const isReadOnlyRoute = roles.includes('viewer') && roles.length === 4;
        const isWriteRoute =
          !roles.includes('viewer') ||
          (roles.includes('member') && !isReadOnlyRoute);

        if (isWriteRoute) {
          // Write routes require either secrets.write or env.pull
          const hasWritePerm =
            apiKey.permissions.includes('secrets.write') ||
            apiKey.permissions.includes('secrets.read');

          if (!hasWritePerm) {
            throw ApiError.forbidden(
              'API key does not have the required permissions'
            );
          }
        } else {
          // Read routes require secrets.read
          if (!apiKey.permissions.includes('secrets.read')) {
            throw ApiError.forbidden(
              'API key does not have read permission'
            );
          }
        }

        req.workspace = workspace;
        return next();
      }

      // ── JWT Authentication Path (existing flow) ──
      const member = workspace.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!member || !roles.includes(member.role)) {
        throw ApiError.forbidden(
          'You do not have permission to perform this action'
        );
      }

      req.workspace = workspace;
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default requireRole;

import Workspace from '../models/Workspace.js';
import ApiError from '../utils/ApiError.js';

/**
 * Role-based access control middleware factory.
 * Checks that the authenticated user is a member of the workspace
 * identified by `req.params.workspaceId` and holds one of the allowed roles.
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

import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WorkspaceDashboard from './pages/WorkspaceDashboard';
import ProjectView from './pages/ProjectView';
import EnvironmentView from './pages/EnvironmentView';
import Environments from './pages/Environments';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<WorkspaceDashboard />} />
          <Route path="workspaces/:workspaceId" element={<WorkspaceDashboard />} />
          <Route path="workspaces/:workspaceId/projects" element={<WorkspaceDashboard />} />
          <Route path="workspaces/:workspaceId/projects/:projectId" element={<ProjectView />} />
          <Route path="workspaces/:workspaceId/environments" element={<Environments />} />
          <Route
            path="workspaces/:workspaceId/environments/:projectId/:envId"
            element={<EnvironmentView />}
          />
          <Route path="workspaces/:workspaceId/audit" element={<AuditLog />} />
          <Route path="workspaces/:workspaceId/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { useToast } from '../contexts/ToastContext';

// Dashboard sub-components
import StatCard from '../components/dashboard/StatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import TopProjects from '../components/dashboard/TopProjects';
import SecurityHealth from '../components/dashboard/SecurityHealth';

// Icons
import {
  KeyRound,
  FolderOpen,
  Globe,
  Users,
  Plus,
} from 'lucide-react';

export default function WorkspaceDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Core states
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalSecrets, setTotalSecrets] = useState(0);
  const [totalEnvironments, setTotalEnvironments] = useState(0);
  const [error, setError] = useState('');

  // Modal create states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [modalError, setModalError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Workspace creation states
  const [workspaceName, setWorkspaceName] = useState('');
  const [createWorkspaceLoading, setCreateWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');

  // Auto redirect to first workspace if none in URL
  useEffect(() => {
    if (!workspaceId) {
      api
        .get('/workspaces')
        .then((res) => {
          if (res.data && res.data.data && res.data.data.workspaces && res.data.data.workspaces.length > 0) {
            navigate(`/workspaces/${res.data.data.workspaces[0]._id}`, { replace: true });
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch workspaces:', err);
          setError('Failed to fetch workspaces.');
          setLoading(false);
        });
    }
  }, [workspaceId, navigate]);

  // Load workspace data, projects, and audit logs
  const fetchWorkspaceData = async () => {
    if (!workspaceId) return;

    try {
      const [workspaceRes, projectsRes, auditRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}`),
        api.get(`/workspaces/${workspaceId}/projects`),
        api.get(`/workspaces/${workspaceId}/audit`),
      ]);

      const ws = workspaceRes.data.data.workspace;
      const projs = projectsRes.data.data.projects || [];
      const logs = auditRes.data.data.logs || [];

      setWorkspace(ws);
      setProjects(projs);
      setAuditLogs(logs);
      setError('');

      // Aggregate environment and secret counts from projects
      let envCount = 0;
      let secretCount = 0;

      // Fetch environment counts for each project
      const envPromises = projs.map(async (project) => {
        try {
          const envRes = await api.get(`/workspaces/${workspaceId}/environments/${project._id}`);
          const envs = envRes.data.data.environments || [];
          project.environmentCount = envs.length;
          envCount += envs.length;

          // Count secrets across all environments
          const secretPromises = envs.map(async (env) => {
            try {
              const secretRes = await api.get(
                `/workspaces/${workspaceId}/environments/${project._id}/${env._id}/secrets`
              );
              return (secretRes.data.data.secrets || []).length;
            } catch {
              return 0;
            }
          });

          const secretCounts = await Promise.all(secretPromises);
          secretCount += secretCounts.reduce((a, b) => a + b, 0);
        } catch {
          project.environmentCount = 0;
        }
      });

      await Promise.all(envPromises);
      setTotalEnvironments(envCount);
      setTotalSecrets(secretCount);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
      setError('Failed to load workspace dashboard.');
      addToast('Failed to load workspace dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceData();
    }
  }, [workspaceId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!projectName.trim()) {
      setModalError('Project name is required');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/projects`, {
        name: projectName.trim(),
        description: projectDesc.trim(),
      });
      setProjects((prev) => [...prev, res.data.data.project]);
      setIsModalOpen(false);
      setProjectName('');
      setProjectDesc('');
      addToast('Project created successfully', 'success');
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to create project');
      addToast('Failed to create project', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setWorkspaceError('');

    if (!workspaceName.trim()) {
      setWorkspaceError('Workspace name is required');
      return;
    }

    setCreateWorkspaceLoading(true);
    try {
      const res = await api.post('/workspaces', {
        name: workspaceName.trim(),
      });
      addToast(`Workspace ${res.data.data.workspace.name} created`, 'success');
      navigate(`/workspaces/${res.data.data.workspace._id}`);
    } catch (err) {
      setWorkspaceError(err.response?.data?.message || err.message || 'Failed to create workspace');
      addToast('Failed to create workspace', 'error');
    } finally {
      setCreateWorkspaceLoading(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-fade-in">
        {/* Skeleton welcome */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '260px', height: '28px' }} />
        </div>
        {/* Skeleton stats */}
        <div className="dash-skeleton-stats">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton dash-skeleton-stat" />
          ))}
        </div>
        {/* Skeleton grid */}
        <div className="dash-skeleton-grid">
          <div className="skeleton dash-skeleton-card" />
          <div className="skeleton dash-skeleton-card" />
        </div>
      </div>
    );
  }

  // ─── No Workspace State ───────────────────────────────────────
  if (!workspaceId) {
    return (
      <div className="empty-state glass-card animate-slide-up" style={{ margin: 'var(--space-8)' }}>
        <div className="empty-state-icon">🔒</div>
        <h3 className="empty-state-title">Welcome to Vaultix</h3>
        <p className="empty-state-desc">
          Create your first workspace to start managing secrets securely across your projects and environments.
        </p>
        <form onSubmit={handleCreateWorkspace} className="modal-form" style={{ maxWidth: '360px', width: '100%', margin: '0 auto' }}>
          {workspaceError && (
            <div className="auth-error" style={{ marginBottom: 'var(--space-4)', marginTop: 0 }}>
              {workspaceError}
            </div>
          )}
          <Input
            placeholder="Workspace Name (e.g. My Team)"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" variant="primary" loading={createWorkspaceLoading} style={{ marginTop: 'var(--space-3)', width: '100%' }}>
            Create Workspace
          </Button>
        </form>
      </div>
    );
  }

  // ─── Stats Data ───────────────────────────────────────────────
  const stats = [
    {
      icon: <KeyRound size={20} />,
      value: totalSecrets.toString(),
      label: 'Total Secrets',
      color: 'purple',
    },
    {
      icon: <FolderOpen size={20} />,
      value: projects.length.toString(),
      label: 'Projects',
      color: 'blue',
    },
    {
      icon: <Globe size={20} />,
      value: totalEnvironments.toString(),
      label: 'Environments',
      color: 'cyan',
    },
    {
      icon: <Users size={20} />,
      value: (workspace?.members?.length || 0).toString(),
      label: 'Team Members',
      color: 'emerald',
    },
  ];

  // ─── Main Dashboard ──────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <div className="dash-welcome">
        <div className="dash-welcome-row">
          <div>
            <div className="dash-welcome-greeting">
              {getGreeting()},
            </div>
            <h1 className="dash-welcome-title">
              {user?.name || 'Welcome back'} 👋
            </h1>
            <div className="dash-welcome-workspace">
              {workspace?.name || 'Workspace Dashboard'}
            </div>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} />
            Create Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-6)' }}>
          {error}
        </div>
      )}

      {/* Empty state when no projects - AT TOP NOW */}
      {projects.length === 0 && (
        <div className="empty-state glass-card animate-slide-up" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="empty-state-icon" style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📂</div>
          <h3 className="empty-state-title" style={{ fontSize: 'var(--font-xl)', color: 'var(--text-primary)' }}>No projects yet</h3>
          <p className="empty-state-desc" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Create your first project to start managing environments and secrets securely.
          </p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Create Project
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i + 1} />
        ))}
      </div>

      {/* Top Banner / Create Project */}
      {projects.length > 0 && (
        <div className="section animate-slide-up" style={{ marginTop: 'var(--space-2)' }}>
          <div className="section-header">
            <h2 className="section-title">All Projects</h2>
            <Button variant="ghost" size="sm" onClick={fetchWorkspaceData}>
              Refresh
            </Button>
          </div>

          <div className="env-grid">
            {projects.map((project, i) => (
              <Link
                key={project._id}
                to={`/workspaces/${workspaceId}/projects/${project._id}`}
                className={`glass-card glass-card--interactive env-card animate-slide-up delay-${(i % 6) + 1}`}
              >
                <div className="env-card-header">
                  <span className="env-card-name">{project.name}</span>
                  <span className="badge badge-purple">Active</span>
                </div>
                <p
                  className="text-secondary text-sm"
                  style={{
                    marginBottom: 'var(--space-3)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '38px',
                  }}
                >
                  {project.description || 'No description provided.'}
                </p>
                <div className="env-card-meta">
                  <div className="env-card-meta-item">
                    <FolderOpen size={13} style={{ opacity: 0.5 }} />
                    <span>Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid below the project grid */}
      <div className="dash-grid">
        {/* Activity Feed */}
        <div className="animate-slide-up delay-5">
          <ActivityFeed logs={auditLogs} maxItems={8} />
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Top Projects */}
          <div className="animate-slide-up delay-5">
            <TopProjects projects={projects} />
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Project">
        <form onSubmit={handleCreateProject} className="modal-form">
          <div className="modal-body">
            {modalError && (
              <div className="auth-error" style={{ margin: 0 }}>
                {modalError}
              </div>
            )}
            <Input
              label="Project Name"
              placeholder="e.g. My Backend App, Frontend Dashboard"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              autoFocus
            />
            <div className="input-wrapper">
              <label className="input-label">Description (Optional)</label>
              <textarea
                className="input-field"
                placeholder="What is this project about?"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={createLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createLoading}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/**
 * Returns a time-appropriate greeting string.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

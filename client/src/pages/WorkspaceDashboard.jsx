import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { useToast } from '../contexts/ToastContext';
import { SkeletonCard, SkeletonText } from '../components/ui/Skeleton';

export default function WorkspaceDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Core states
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
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

  // Load workspace data and project list
  const fetchWorkspaceData = async () => {
    if (!workspaceId) return;

    try {
      const [workspaceRes, projectsRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}`),
        api.get(`/workspaces/${workspaceId}/projects`),
      ]);

      setWorkspace(workspaceRes.data.data.workspace);
      setProjects(projectsRes.data.data.projects || []);
      setError('');
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

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div style={{ width: '100%' }}>
            <SkeletonText lines={2} style={{ width: '300px' }} />
          </div>
        </div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="section" style={{ marginTop: '2rem' }}>
          <div className="env-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div className="empty-state glass-card animate-slide-up" style={{ margin: 'var(--space-8)' }}>
        <div className="empty-state-icon">🌐</div>
        <h3 className="empty-state-title">Welcome to Vaultix!</h3>
        <p className="empty-state-desc">
          To start managing projects, environments, and secrets, you need to create your first workspace.
        </p>
        <form onSubmit={handleCreateWorkspace} className="modal-form" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          {workspaceError && (
            <div className="auth-error" style={{ marginBottom: 'var(--space-4)', marginTop: 0 }}>
              {workspaceError}
            </div>
          )}
          <Input
            placeholder="Workspace Name (e.g. My Workspace)"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" variant="primary" loading={createWorkspaceLoading} style={{ marginTop: 'var(--space-4)', width: '100%' }}>
            Create Workspace
          </Button>
        </form>
      </div>
    );
  }

  // Real stats
  const stats = [
    { label: 'Total Projects', value: projects.length.toString(), icon: '📁', color: 'indigo' },
    { label: 'Team Members', value: workspace?.members?.length.toString() || '0', icon: '👥', color: 'emerald' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{workspace?.name || 'Workspace Dashboard'}</h1>
          <p className="page-subtitle">Manage projects, environments, and secrets for this workspace.</p>
        </div>
        <Button variant="primary" icon="➕" onClick={() => setIsModalOpen(true)}>
          Create Project
        </Button>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-8)' }}>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {stats.map((stat, i) => (
          <div key={stat.label} className={`glass-card stat-card animate-slide-up delay-${i + 1}`}>
            <div className={`stat-icon stat-icon--${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="section animate-slide-up delay-3">
        <div className="section-header">
          <h2 className="section-title">Projects</h2>
          <Button variant="ghost" size="sm" onClick={fetchWorkspaceData}>
            Refresh
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="env-grid">
            {projects.map((project, i) => (
              <Link
                key={project._id}
                to={`/workspaces/${workspaceId}/projects/${project._id}`}
                className={`glass-card glass-card--interactive env-card animate-slide-up delay-${(i % 6) + 1}`}
              >
                <div className="env-card-header">
                  <span className="env-card-name">{project.name}</span>
                  <span className="badge badge-info">Active</span>
                </div>
                <p
                  className="text-secondary text-sm"
                  style={{
                    marginBottom: 'var(--space-4)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '42px',
                  }}
                >
                  {project.description || 'No description provided.'}
                </p>
                <div className="env-card-meta">
                  <div className="env-card-meta-item">
                    <span>🕐</span>
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state glass-card">
            <div className="empty-state-icon">📂</div>
            <h3 className="empty-state-title">No projects yet</h3>
            <p className="empty-state-desc">Create your first project to start managing environments and secrets.</p>
            <Button variant="primary" icon="➕" onClick={() => setIsModalOpen(true)}>
              Create Project
            </Button>
          </div>
        )}
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

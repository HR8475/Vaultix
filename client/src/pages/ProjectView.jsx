import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';

export default function ProjectView() {
  const { workspaceId, projectId } = useParams();
  const [project, setProject] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Environment creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [envName, setEnvName] = useState('');
  const [modalError, setModalError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchData = async () => {
    if (!workspaceId || !projectId) return;
    try {
      const [projectRes, envsRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/projects/${projectId}`),
        api.get(`/workspaces/${workspaceId}/environments/${projectId}`),
      ]);
      setProject(projectRes.data.data.project);
      setEnvironments(envsRes.data.data.environments || []);
    } catch (err) {
      console.error('Error fetching project/environments:', err);
      setError('Failed to load project details and environments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId, projectId]);

  const handleCreateEnvironment = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!envName.trim()) {
      setModalError('Environment name is required');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/environments/${projectId}`, {
        name: envName.trim(),
      });
      setEnvironments((prev) => [...prev, res.data.data.environment]);
      setIsModalOpen(false);
      setEnvName('');
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to create environment');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner--md" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <nav className="breadcrumb" style={{ fontSize: 'var(--font-sm)' }}>
          <Link to={`/workspaces/${workspaceId}`} className="breadcrumb-item">
            Workspace
          </Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item current">{project?.name || 'Project'}</span>
        </nav>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{project?.name || 'Project Alpha'}</h1>
          <p className="page-subtitle">Project ID: {projectId}</p>
        </div>
        <Button variant="primary" icon="➕" onClick={() => setIsModalOpen(true)}>
          New Environment
        </Button>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-6)' }}>
          {error}
        </div>
      )}

      {/* Description */}
      <p className="project-description">
        {project?.description ||
          'Manage your environment variables, API keys, and sensitive configuration values across different deployment stages.'}
      </p>

      {/* Environments Grid */}
      {environments.length > 0 ? (
        <div className="env-grid">
          {environments.map((env, i) => (
            <Link
              key={env._id}
              to={`/workspaces/${workspaceId}/environments/${projectId}/${env._id}`}
              className={`glass-card glass-card--interactive env-card animate-slide-up delay-${(i % 6) + 1}`}
            >
              <div className="env-card-header">
                <span className="env-card-name">{env.name}</span>
                <span className="badge badge-success">Active</span>
              </div>
              <div className="env-card-meta">
                <div className="env-card-meta-item">
                  <span>📂</span>
                  <span>slug: {env.slug}</span>
                </div>
                <div className="env-card-meta-item">
                  <span>🕐</span>
                  <span>Created {new Date(env.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state glass-card">
          <div className="empty-state-icon">🌐</div>
          <h3 className="empty-state-title">No environments yet</h3>
          <p className="empty-state-desc">
            Create your first environment to start managing secrets for this project.
          </p>
          <Button variant="primary" icon="➕" onClick={() => setIsModalOpen(true)}>
            Create Environment
          </Button>
        </div>
      )}

      {/* Create Environment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Environment">
        <form onSubmit={handleCreateEnvironment} className="modal-form">
          <div className="modal-body">
            {modalError && (
              <div className="auth-error" style={{ margin: 0 }}>
                {modalError}
              </div>
            )}
            <Input
              label="Environment Name"
              placeholder="e.g. Staging, Production"
              value={envName}
              onChange={(e) => setEnvName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={createLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createLoading}>
              Create Environment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

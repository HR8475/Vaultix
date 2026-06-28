import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { useToast } from '../contexts/ToastContext';
import {
  FolderOpen,
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Calendar,
  Globe,
} from 'lucide-react';

export default function Projects() {
  const { workspaceId } = useParams();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [modalError, setModalError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (workspaceId) fetchProjects();
  }, [workspaceId]);

  const fetchProjects = async () => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/projects`);
      const projs = res.data.data.projects || [];

      // Fetch environment counts for each project
      const enriched = await Promise.all(
        projs.map(async (project) => {
          try {
            const envRes = await api.get(`/workspaces/${workspaceId}/environments/${project._id}`);
            const envs = envRes.data.data.environments || [];
            return { ...project, environmentCount: envs.length };
          } catch {
            return { ...project, environmentCount: 0 };
          }
        })
      );

      setProjects(enriched);
      setError('');
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects.');
      addToast('Failed to load projects.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      setProjects((prev) => [...prev, { ...res.data.data.project, environmentCount: 0 }]);
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

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [projects, searchQuery, sortBy]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className="skeleton" style={{ width: '180px', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '300px', height: '16px' }} />
        </div>
        <div className="dash-skeleton-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton dash-skeleton-stat" />
          ))}
        </div>
        <div className="env-grid" style={{ marginTop: 'var(--space-6)' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="projects-page-header">
        <div className="projects-page-header-left">
          <h1 className="projects-page-title">
            <FolderOpen size={24} style={{ color: 'var(--accent-secondary)' }} />
            All Projects
          </h1>
          <p className="projects-page-subtitle">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in this workspace
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} />
          New Project
        </Button>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-6)' }}>
          {error}
        </div>
      )}

      {/* Search & Controls Bar */}
      {projects.length > 0 && (
        <div className="projects-controls animate-slide-up delay-1">
          <div className="projects-search-wrapper">
            <Search size={16} className="projects-search-icon" />
            <input
              type="text"
              className="projects-search-input"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="projects-controls-right">
            {/* Sort dropdown */}
            <div className="projects-sort-wrapper">
              <ArrowUpDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <select
                className="projects-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {/* View mode toggle */}
            <div className="projects-view-toggle">
              <button
                className={`projects-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`projects-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="empty-state glass-card animate-slide-up" style={{ marginTop: 'var(--space-6)' }}>
          <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>📂</div>
          <h3 className="empty-state-title" style={{ fontSize: 'var(--font-xl)', color: 'var(--text-primary)' }}>
            No projects yet
          </h3>
          <p className="empty-state-desc" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Create your first project to start managing environments and secrets securely.
          </p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Create Project
          </Button>
        </div>
      )}

      {/* No search results */}
      {projects.length > 0 && filteredProjects.length === 0 && (
        <div className="empty-state glass-card animate-slide-up" style={{ marginTop: 'var(--space-6)' }}>
          <div className="empty-state-icon" style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🔍</div>
          <h3 className="empty-state-title" style={{ fontSize: 'var(--font-xl)', color: 'var(--text-primary)' }}>
            No matching projects
          </h3>
          <p className="empty-state-desc" style={{ color: 'var(--text-secondary)' }}>
            Try a different search term or clear the filter.
          </p>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length > 0 && viewMode === 'grid' && (
        <div className="env-grid" style={{ marginTop: 'var(--space-4)' }}>
          {filteredProjects.map((project, i) => (
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
                  <Calendar size={13} style={{ opacity: 0.5 }} />
                  <span>
                    {new Date(project.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="env-card-meta-item">
                  <Globe size={13} style={{ opacity: 0.5 }} />
                  <span>{project.environmentCount || 0} env{(project.environmentCount || 0) !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Projects List View */}
      {filteredProjects.length > 0 && viewMode === 'list' && (
        <div className="projects-list animate-slide-up delay-1" style={{ marginTop: 'var(--space-4)' }}>
          {filteredProjects.map((project, i) => (
            <Link
              key={project._id}
              to={`/workspaces/${workspaceId}/projects/${project._id}`}
              className={`projects-list-item animate-slide-up delay-${(i % 6) + 1}`}
            >
              <div className="projects-list-item-icon">
                <FolderOpen size={18} />
              </div>
              <div className="projects-list-item-info">
                <div className="projects-list-item-name">{project.name}</div>
                <div className="projects-list-item-desc">
                  {project.description || 'No description provided.'}
                </div>
              </div>
              <div className="projects-list-item-meta">
                <span className="badge badge-purple" style={{ marginRight: 'var(--space-3)' }}>Active</span>
                <div className="env-card-meta-item">
                  <Globe size={13} style={{ opacity: 0.5 }} />
                  <span>{project.environmentCount || 0} env{(project.environmentCount || 0) !== 1 ? 's' : ''}</span>
                </div>
                <div className="env-card-meta-item" style={{ marginLeft: 'var(--space-3)' }}>
                  <Calendar size={13} style={{ opacity: 0.5 }} />
                  <span>
                    {new Date(project.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

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

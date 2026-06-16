import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';

export default function Environments() {
  const { workspaceId } = useParams();
  const [projects, setProjects] = useState([]);
  const [projectEnvironments, setProjectEnvironments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAllData = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      // 1. Fetch projects
      const projectsRes = await api.get(`/workspaces/${workspaceId}/projects`);
      const projectsList = projectsRes.data.data.projects || [];
      setProjects(projectsList);

      // 2. Fetch environments for all projects in parallel
      const envPromises = projectsList.map(async (project) => {
        try {
          const envsRes = await api.get(`/workspaces/${workspaceId}/environments/${project._id}`);
          return { projectId: project._id, envs: envsRes.data.data.environments || [] };
        } catch (err) {
          console.error(`Failed to load environments for project ${project._id}:`, err);
          return { projectId: project._id, envs: [] };
        }
      });

      const results = await Promise.all(envPromises);
      const envMap = {};
      results.forEach((item) => {
        envMap[item.projectId] = item.envs;
      });

      setProjectEnvironments(envMap);
      setError('');
    } catch (err) {
      console.error('Failed to load environments data:', err);
      setError('Failed to load environments dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner--md" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Environments</h1>
          <p className="page-subtitle">View and configure environments for all projects in this workspace.</p>
        </div>
        <Button variant="ghost" icon="🔄" onClick={fetchAllData}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-8)' }}>
          {error}
        </div>
      )}

      {projects.length > 0 ? (
        <div className="env-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {projects.map((project, idx) => {
            const envs = projectEnvironments[project._id] || [];

            return (
              <div
                key={project._id}
                className={`glass-card animate-slide-up delay-${(idx % 6) + 1}`}
                style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="env-card-name" style={{ fontSize: 'var(--font-lg)', margin: 0 }}>{project.name}</h3>
                    <p className="text-secondary text-xs" style={{ margin: 'var(--space-1) 0 0 0' }}>ID: {project._id}</p>
                  </div>
                  <Link to={`/workspaces/${workspaceId}/projects/${project._id}`}>
                    <Button variant="ghost" size="sm">Manage</Button>
                  </Link>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <h4 style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>Active Environments</h4>
                  {envs.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {envs.map((env) => (
                        <Link
                          key={env._id}
                          to={`/workspaces/${workspaceId}/environments/${project._id}/${env._id}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <span
                            className="badge badge-success"
                            style={{
                              padding: 'var(--space-2) var(--space-3)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 'var(--font-xs)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 'var(--space-1.5)',
                              transition: 'transform 0.15s ease, background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <span>🌐</span> {env.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-secondary text-sm" style={{ fontStyle: 'italic' }}>
                      No environments created yet.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                  <Link to={`/workspaces/${workspaceId}/projects/${project._id}`}>
                    <Button variant="primary" size="sm" icon="➕">Add Env</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state glass-card">
          <div className="empty-state-icon">📁</div>
          <h3 className="empty-state-title">No projects found</h3>
          <p className="empty-state-desc">You need to create a project first to manage environments.</p>
          <Link to={`/workspaces/${workspaceId}`}>
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

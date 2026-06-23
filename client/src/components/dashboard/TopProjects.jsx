import { Link, useParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';

export default function TopProjects({ projects = [] }) {
  const { workspaceId } = useParams();

  if (projects.length === 0) {
    return (
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Top Projects</div>
            <div className="dash-card-subtitle">Your most active projects</div>
          </div>
        </div>
        <div className="dash-card-body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '2rem', opacity: 0.2, marginBottom: 'var(--space-3)' }}>📁</div>
          <p className="text-secondary text-sm">No projects yet</p>
        </div>
      </div>
    );
  }

  // Sort by created date (newest first) and take top 5
  const topProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const maxEnvCount = Math.max(...topProjects.map((p) => p.environmentCount || 1), 1);

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Top Projects</div>
          <div className="dash-card-subtitle">Your most active projects</div>
        </div>
        {workspaceId && (
          <Link to={`/workspaces/${workspaceId}/projects`} className="dash-card-action">
            View all →
          </Link>
        )}
      </div>
      <div className="dash-card-body--flush">
        {topProjects.map((project, i) => (
          <Link
            key={project._id}
            to={`/workspaces/${workspaceId}/projects/${project._id}`}
            className="project-rank-item"
          >
            <div className="project-rank-index">{i + 1}</div>
            <FolderOpen size={16} style={{ color: 'var(--accent-secondary)', flexShrink: 0, opacity: 0.7 }} />
            <div className="project-rank-info">
              <div className="project-rank-name">{project.name}</div>
              <div className="project-rank-meta">
                Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="project-rank-bar">
              <div
                className="project-rank-bar-fill"
                style={{ width: `${Math.max(((project.environmentCount || 1) / maxEnvCount) * 100, 15)}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

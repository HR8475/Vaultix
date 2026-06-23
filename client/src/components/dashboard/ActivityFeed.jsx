import { Link, useParams } from 'react-router-dom';

/**
 * Map audit log action strings to human-readable descriptions and dot colors.
 */
function formatAction(log) {
  const actor = log.user?.name || 'Someone';
  const action = log.action;

  const map = {
    'secret.create':       { text: <><strong>{actor}</strong> <span className="action-verb">created</span> a secret</>, dot: 'create' },
    'secret.update':       { text: <><strong>{actor}</strong> <span className="action-verb">updated</span> a secret</>, dot: 'update' },
    'secret.delete':       { text: <><strong>{actor}</strong> <span className="action-verb">deleted</span> a secret</>, dot: 'delete' },
    'secret.read':         { text: <><strong>{actor}</strong> <span className="action-verb">viewed</span> a secret</>, dot: 'read' },
    'secret.access':       { text: <><strong>{actor}</strong> <span className="action-verb">accessed</span> a secret</>, dot: 'read' },
    'project.create':      { text: <><strong>{actor}</strong> <span className="action-verb">created</span> a project</>, dot: 'create' },
    'project.update':      { text: <><strong>{actor}</strong> <span className="action-verb">updated</span> a project</>, dot: 'update' },
    'project.delete':      { text: <><strong>{actor}</strong> <span className="action-verb">deleted</span> a project</>, dot: 'delete' },
    'environment.create':  { text: <><strong>{actor}</strong> <span className="action-verb">created</span> an environment</>, dot: 'create' },
    'environment.update':  { text: <><strong>{actor}</strong> <span className="action-verb">updated</span> an environment</>, dot: 'update' },
    'environment.delete':  { text: <><strong>{actor}</strong> <span className="action-verb">deleted</span> an environment</>, dot: 'delete' },
    'workspace.create':    { text: <><strong>{actor}</strong> <span className="action-verb">created</span> the workspace</>, dot: 'workspace' },
    'workspace.update':    { text: <><strong>{actor}</strong> <span className="action-verb">updated</span> workspace settings</>, dot: 'workspace' },
    'workspace.addMember': { text: <><strong>{actor}</strong> <span className="action-verb">invited</span> a member</>, dot: 'workspace' },
    'user.signup':         { text: <><strong>{actor}</strong> <span className="action-verb">signed up</span></>, dot: 'auth' },
    'user.login':          { text: <><strong>{actor}</strong> <span className="action-verb">logged in</span></>, dot: 'auth' },
    'user.logout':         { text: <><strong>{actor}</strong> <span className="action-verb">logged out</span></>, dot: 'auth' },
  };

  const match = map[action];
  if (match) return match;

  return {
    text: <><strong>{actor}</strong> performed <span className="action-verb">{action}</span></>,
    dot: 'read',
  };
}

/**
 * Format a timestamp to a human-readable relative time string.
 */
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityFeed({ logs = [], maxItems = 8 }) {
  const { workspaceId } = useParams();
  const displayLogs = logs.slice(0, maxItems);

  if (displayLogs.length === 0) {
    return (
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Recent Activity</div>
            <div className="dash-card-subtitle">Latest actions in your workspace</div>
          </div>
        </div>
        <div className="dash-card-body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '2rem', opacity: 0.2, marginBottom: 'var(--space-3)' }}>📋</div>
          <p className="text-secondary text-sm">No activity recorded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Recent Activity</div>
          <div className="dash-card-subtitle">Latest actions in your workspace</div>
        </div>
        {workspaceId && (
          <Link to={`/workspaces/${workspaceId}/audit`} className="dash-card-action">
            View all →
          </Link>
        )}
      </div>
      <div className="dash-card-body--flush">
        <div className="activity-feed">
          {displayLogs.map((log) => {
            const { text, dot } = formatAction(log);
            return (
              <div key={log._id} className="activity-feed-item">
                <div className={`activity-feed-dot activity-feed-dot--${dot}`} />
                <div className="activity-feed-body">
                  <div className="activity-feed-text">{text}</div>
                  <div className="activity-feed-time">{timeAgo(log.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

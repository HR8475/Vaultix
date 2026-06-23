import { ShieldCheck, Users, FolderOpen, Activity } from 'lucide-react';

export default function SecurityHealth({ workspace, projects = [], auditLogs = [] }) {
  const memberCount = workspace?.members?.length || 0;
  const projectCount = projects.length;
  const recentActivityCount = auditLogs.filter((log) => {
    const logDate = new Date(log.timestamp);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return logDate > dayAgo;
  }).length;

  const secretActions = auditLogs.filter((log) => log.action.startsWith('secret.')).length;

  const items = [
    {
      label: 'Team Members',
      value: memberCount,
      status: memberCount > 0 ? 'good' : 'warn',
    },
    {
      label: 'Active Projects',
      value: projectCount,
      status: projectCount > 0 ? 'good' : 'warn',
    },
    {
      label: 'Activity (24h)',
      value: recentActivityCount,
      status: recentActivityCount > 0 ? 'good' : 'warn',
    },
    {
      label: 'Secret Operations',
      value: secretActions,
      status: 'good',
    },
  ];

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            Security Overview
          </div>
          <div className="dash-card-subtitle">Workspace health at a glance</div>
        </div>
      </div>
      <div className="dash-card-body--flush">
        {items.map((item, i) => (
          <div key={i} className="health-item">
            <div className={`health-indicator health-indicator--${item.status}`} />
            <div className="health-label">{item.label}</div>
            <div className="health-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

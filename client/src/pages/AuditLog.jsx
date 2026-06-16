import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';

export default function AuditLog() {
  const { workspaceId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/audit`);
      setLogs(res.data.data.logs || []);
      setError('');
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [workspaceId]);

  const getActionBadgeClass = (action) => {
    if (action.startsWith('secret.')) {
      if (action.endsWith('.create')) return 'badge-success';
      if (action.endsWith('.update')) return 'badge-info';
      if (action.endsWith('.delete')) return 'badge-danger';
      return 'badge-info'; // read
    }
    if (action.startsWith('project.')) return 'badge-warning';
    if (action.startsWith('environment.')) return 'badge-success';
    if (action.startsWith('user.')) return 'badge-info';
    return 'badge-info';
  };

  const getActionIcon = (action) => {
    if (action.includes('secret')) return '🔑';
    if (action.includes('project')) return '📁';
    if (action.includes('environment')) return '🌐';
    if (action.includes('user')) return '👤';
    return '📋';
  };

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'all') return true;
    if (filterAction === 'secrets') return log.action.startsWith('secret.');
    if (filterAction === 'projects') return log.action.startsWith('project.');
    if (filterAction === 'environments') return log.action.startsWith('environment.');
    if (filterAction === 'user') return log.action.startsWith('user.');
    return true;
  });

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
          <h1 className="page-title">Audit Log</h1>
          <p className="page-subtitle">Track security and configuration changes in this workspace.</p>
        </div>
        <Button variant="ghost" icon="🔄" onClick={fetchLogs}>
          Refresh
        </Button>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-8)' }}>
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Events' },
          { id: 'secrets', label: 'Secrets Only' },
          { id: 'projects', label: 'Projects Only' },
          { id: 'environments', label: 'Environments Only' },
          { id: 'user', label: 'Auth & Team' },
        ].map((btn) => (
          <Button
            key={btn.id}
            variant={filterAction === btn.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterAction(btn.id)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Logs Table / Timeline */}
      {filteredLogs.length > 0 ? (
        <div className="secrets-table-container glass-card animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="secrets-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Type</th>
                <th>Action</th>
                <th>Actor</th>
                <th>IP Address</th>
                <th>Timestamp</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td style={{ textAlign: 'center', fontSize: 'var(--font-lg)' }}>
                    {getActionIcon(log.action)}
                  </td>
                  <td>
                    <span className={`badge ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500' }}>{log.user?.name || 'Unknown'}</span>
                      <span className="text-secondary text-xs">{log.user?.email || ''}</span>
                    </div>
                  </td>
                  <td>
                    <code className="text-secondary text-xs">{log.ipAddress || 'N/A'}</code>
                  </td>
                  <td>
                    <span className="text-secondary text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    {log.metadata ? (
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 'var(--font-xs)',
                          fontFamily: "'JetBrains Mono', monospace",
                          maxHeight: '60px',
                          overflow: 'auto',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: 'var(--space-1.5)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-secondary text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state glass-card">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No audit logs</h3>
          <p className="empty-state-desc">No events match your current filter, or no actions have occurred yet.</p>
        </div>
      )}
    </div>
  );
}

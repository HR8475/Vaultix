import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { workspaceId } = useParams();
  const { user: currentUser } = useAuth();

  // Workspace Info State
  const [workspace, setWorkspace] = useState(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Team Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Members list & management
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check current user's role in this workspace
  const userMember = workspace?.members?.find(
    (m) => (m.user?._id || m.user) === currentUser?._id
  );
  const userRole = userMember?.role || 'viewer';
  const isAuthorized = userRole === 'owner' || userRole === 'admin';

  const fetchWorkspace = async () => {
    if (!workspaceId) return;
    try {
      const res = await api.get(`/workspaces/${workspaceId}`);
      const ws = res.data.data.workspace;
      setWorkspace(ws);
      setWorkspaceName(ws.name);
      setMembers(ws.members || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch workspace details:', err);
      setError('Failed to fetch workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const handleRenameWorkspace = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return;
    setGeneralLoading(true);
    setGeneralSuccess('');
    setGeneralError('');

    try {
      const res = await api.patch(`/workspaces/${workspaceId}`, {
        name: workspaceName.trim(),
      });
      setWorkspace(res.data.data.workspace);
      setGeneralSuccess('Workspace name updated successfully!');
      // Force reload header or sidebar if possible by dispatching window event or similar
      window.dispatchEvent(new Event('workspace_update'));
    } catch (err) {
      setGeneralError(err.response?.data?.message || err.message || 'Failed to update workspace name.');
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return;
    setInviteLoading(true);
    setInviteSuccess('');
    setInviteError('');

    try {
      const res = await api.post(`/workspaces/${workspaceId}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setWorkspace(res.data.data.workspace);
      setMembers(res.data.data.workspace.members || []);
      setInviteEmail('');
      setInviteSuccess('Member added successfully!');
      fetchWorkspace(); // reload populated names
    } catch (err) {
      setInviteError(err.response?.data?.message || err.message || 'Failed to add member.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    if (userRole !== 'owner') {
      alert('Only the workspace owner can update member roles.');
      return;
    }

    try {
      const res = await api.patch(`/workspaces/${workspaceId}/members/${memberId}`, {
        role: newRole,
      });
      setWorkspace(res.data.data.workspace);
      setMembers(res.data.data.workspace.members || []);
      alert('Member role updated successfully!');
      fetchWorkspace(); // reload populated
    } catch (err) {
      console.error('Failed to update member role:', err);
      alert(err.response?.data?.message || err.message || 'Failed to update role.');
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure workspace details and manage team members.</p>
        </div>
      </div>

      {error && (
        <div className="auth-error" style={{ margin: 0 }}>
          {error}
        </div>
      )}

      {/* Grid containing General Settings & Invites */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)', alignItems: 'stretch' }}>
        {/* General Settings */}
        <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', margin: 0 }}>General Settings</h2>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

          <form onSubmit={handleRenameWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1 }}>
            {generalSuccess && <div className="badge badge-success" style={{ padding: 'var(--space-2)' }}>{generalSuccess}</div>}
            {generalError && <div className="auth-error" style={{ margin: 0 }}>{generalError}</div>}

            <Input
              label="Workspace Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={!isAuthorized}
              required
            />

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" loading={generalLoading} disabled={!isAuthorized}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Invite Team Member */}
        <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', margin: 0 }}>Invite Team Member</h2>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

          <form onSubmit={handleInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1 }}>
            {inviteSuccess && <div className="badge badge-success" style={{ padding: 'var(--space-2)' }}>{inviteSuccess}</div>}
            {inviteError && <div className="auth-error" style={{ margin: 0 }}>{inviteError}</div>}

            <Input
              label="Email Address"
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={!isAuthorized}
              required
            />

            <div className="input-wrapper">
              <label className="input-label">Workspace Role</label>
              <select
                className="input-field"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={!isAuthorized}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="admin">Admin (Can manage environments, secrets, settings)</option>
                <option value="member">Member (Can manage secrets, but not settings)</option>
                <option value="viewer">Viewer (Read-only access to secrets)</option>
              </select>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" loading={inviteLoading} disabled={!isAuthorized}>
                Invite Member
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Team Members List */}
      <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--font-lg)', margin: 0 }}>Workspace Members</h2>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

        <div className="secrets-table-container" style={{ padding: 0, overflow: 'hidden', border: 'none' }}>
          <table className="secrets-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined At</th>
                {userRole === 'owner' && <th style={{ width: 180 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member, idx) => {
                const u = member.user || {};
                const isSelf = u._id === currentUser?._id;

                return (
                  <tr key={u._id || idx}>
                    <td>
                      <span style={{ fontWeight: '500' }}>{u.name || 'Invited User'}</span>
                      {isSelf && <span className="badge badge-info" style={{ marginLeft: 'var(--space-2)' }}>You</span>}
                    </td>
                    <td>
                      <span className="text-secondary text-sm">{u.email || '—'}</span>
                    </td>
                    <td>
                      <span className={`badge ${member.role === 'owner' ? 'badge-warning' : member.role === 'admin' ? 'badge-success' : 'badge-info'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary text-sm">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Pending'}
                      </span>
                    </td>
                    {userRole === 'owner' && (
                      <td>
                        {!isSelf && member.role !== 'owner' ? (
                          <select
                            className="input-field"
                            value={member.role}
                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                            style={{
                              padding: 'var(--space-1) var(--space-2)',
                              fontSize: 'var(--font-xs)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className="text-secondary text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

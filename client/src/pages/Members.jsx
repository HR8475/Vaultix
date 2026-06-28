import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Users, UserPlus, Shield, Eye, Crown, Trash2, ChevronDown,
} from 'lucide-react';

const ROLE_CONFIG = {
  owner: { label: 'Owner', color: 'warning', icon: <Crown size={14} />, desc: 'Full control over the workspace' },
  admin: { label: 'Admin', color: 'success', icon: <Shield size={14} />, desc: 'Manage environments, secrets & settings' },
  member: { label: 'Member', color: 'info', icon: <Users size={14} />, desc: 'Manage secrets but not settings' },
  viewer: { label: 'Viewer', color: 'purple', icon: <Eye size={14} />, desc: 'Read-only access to secrets' },
};

export default function Members() {
  const { workspaceId } = useParams();
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Remove confirmation
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Current user role
  const userMember = workspace?.members?.find(
    (m) => (m.user?._id || m.user) === currentUser?._id
  );
  const userRole = userMember?.role || 'viewer';
  const isOwner = userRole === 'owner';
  const isAuthorized = userRole === 'owner' || userRole === 'admin';

  const fetchMembers = async () => {
    if (!workspaceId) return;
    try {
      const res = await api.get(`/workspaces/${workspaceId}`);
      const ws = res.data.data.workspace;
      setWorkspace(ws);
      setMembers(ws.members || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load workspace members.');
      addToast('Failed to load members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }
    setInviteLoading(true);
    try {
      await api.post(`/workspaces/${workspaceId}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      addToast('Member invited successfully!', 'success');
      fetchMembers();
    } catch (err) {
      setInviteError(err.response?.data?.message || err.message || 'Failed to invite member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await api.patch(`/workspaces/${workspaceId}/members/${memberId}`, {
        role: newRole,
      });
      addToast('Role updated successfully', 'success');
      fetchMembers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${removeTarget._id}`);
      addToast('Member removed', 'success');
      setRemoveTarget(null);
      fetchMembers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
    } finally {
      setRemoveLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Pending';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className="skeleton" style={{ width: '180px', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '280px', height: '16px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="projects-page-header">
        <div className="projects-page-header-left">
          <h1 className="projects-page-title">
            <Users size={24} style={{ color: 'var(--accent-secondary)' }} />
            Members
          </h1>
          <p className="projects-page-subtitle">
            {members.length} member{members.length !== 1 ? 's' : ''} in this workspace
          </p>
        </div>
        {isAuthorized && (
          <Button variant="primary" onClick={() => setInviteOpen(true)}>
            <UserPlus size={14} />
            Invite Member
          </Button>
        )}
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-6)' }}>
          {error}
        </div>
      )}

      {/* Role Summary Cards */}
      <div className="members-role-summary animate-slide-up delay-1">
        {['owner', 'admin', 'member', 'viewer'].map((role) => {
          const count = members.filter((m) => m.role === role).length;
          const cfg = ROLE_CONFIG[role];
          return (
            <div key={role} className="members-role-card">
              <div className={`members-role-card-icon badge-${cfg.color}`}>
                {cfg.icon}
              </div>
              <div className="members-role-card-info">
                <div className="members-role-card-count">{count}</div>
                <div className="members-role-card-label">{cfg.label}{count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members List */}
      <div className="members-list animate-slide-up delay-2">
        {members.map((member, i) => {
          const u = member.user || {};
          const isSelf = u._id === currentUser?._id;
          const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
          const memberInitials = u.name
            ? u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
            : '??';

          return (
            <div key={u._id || i} className={`members-list-item animate-slide-up delay-${(i % 6) + 1}`}>
              <div className="members-list-item-avatar" style={{
                background: member.role === 'owner' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                  member.role === 'admin' ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
                  'var(--accent-gradient)',
              }}>
                {memberInitials}
              </div>

              <div className="members-list-item-info">
                <div className="members-list-item-name">
                  {u.name || 'Invited User'}
                  {isSelf && <span className="badge badge-info" style={{ marginLeft: 'var(--space-2)', fontSize: '0.55rem' }}>You</span>}
                </div>
                <div className="members-list-item-email">{u.email || '—'}</div>
              </div>

              <div className="members-list-item-joined">
                <span className="members-list-item-joined-label">Joined</span>
                <span className="members-list-item-joined-date">{formatDate(member.joinedAt)}</span>
              </div>

              <div className="members-list-item-role">
                {isOwner && !isSelf && member.role !== 'owner' ? (
                  <div className="members-role-select-wrapper">
                    <select
                      className="members-role-select"
                      value={member.role}
                      onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <ChevronDown size={12} className="members-role-select-arrow" />
                  </div>
                ) : (
                  <span className={`badge badge-${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                )}
              </div>

              <div className="members-list-item-actions">
                {isAuthorized && !isSelf && member.role !== 'owner' ? (
                  <button
                    className="members-remove-btn"
                    onClick={() => setRemoveTarget(u)}
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <span style={{ width: '32px' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Member">
        <form onSubmit={handleInvite} className="modal-form">
          <div className="modal-body">
            {inviteError && (
              <div className="auth-error" style={{ margin: 0 }}>{inviteError}</div>
            )}
            <Input
              label="Email Address"
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              autoFocus
            />
            <div className="input-wrapper">
              <label className="input-label">Role</label>
              <select
                className="input-field"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="admin">Admin — Manage environments, secrets & settings</option>
                <option value="member">Member — Manage secrets but not settings</option>
                <option value="viewer">Viewer — Read-only access</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)} disabled={inviteLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={inviteLoading}>
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Member"
      >
        <div className="modal-body" style={{ padding: 'var(--space-6)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.6 }}>
            Are you sure you want to remove{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{removeTarget?.name || removeTarget?.email}</strong>{' '}
            from this workspace? They will lose access to all projects and secrets.
          </p>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setRemoveTarget(null)} disabled={removeLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemoveMember} loading={removeLoading}>
            Remove Member
          </Button>
        </div>
      </Modal>
    </div>
  );
}

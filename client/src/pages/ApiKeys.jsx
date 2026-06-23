import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Key, Plus, Trash2, Copy, RefreshCw, AlertCircle, Info, ChevronDown } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { useToast } from '../contexts/ToastContext';
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
export default function ApiKeys() {
  const { workspaceId } = useParams();
  const { addToast } = useToast();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  
  // Create Key Form State
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpires, setNewKeyExpires] = useState(''); // Empty string means never
  const [newKeyPermissions, setNewKeyPermissions] = useState({
    'secrets.read': true,
    'env.pull': true,
    'secrets.write': false
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, [workspaceId]);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${workspaceId}/api-keys`);
      setKeys(res.data.data.keys);
    } catch (err) {
      addToast('Failed to load API keys', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      addToast('Key name is required', 'error');
      return;
    }

    const perms = Object.entries(newKeyPermissions)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    if (perms.length === 0) {
      addToast('Select at least one permission', 'error');
      return;
    }

    try {
      setCreating(true);
      
      const payload = {
        name: newKeyName,
        permissions: perms,
        expiresAt: newKeyExpires ? getExpiryDate(newKeyExpires) : null
      };

      const res = await api.post(`/workspaces/${workspaceId}/api-keys`, payload);
      
      setNewlyCreatedKey(res.data.data.plaintextKey);
      fetchKeys();
      
      // Reset form but don't close modal so they can copy the key
      setNewKeyName('');
      setNewKeyExpires('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create API key', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!selectedKey) return;
    
    try {
      await api.delete(`/workspaces/${workspaceId}/api-keys/${selectedKey._id}`);
      addToast('API key revoked successfully', 'success');
      setShowRevokeModal(false);
      fetchKeys();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to revoke API key', 'error');
    }
  };

  const handleRotateKey = async (key) => {
    if (!confirm(`Are you sure you want to rotate "${key.name}"? The old key will stop working immediately.`)) {
      return;
    }
    
    try {
      const res = await api.post(`/workspaces/${workspaceId}/api-keys/${key._id}/rotate`);
      setNewlyCreatedKey(res.data.data.plaintextKey);
      setShowCreateModal(true); // Show modal just to display the new key
      fetchKeys();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to rotate API key', 'error');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    addToast(`${type} copied to clipboard`, 'success');
  };

  const getExpiryDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(days));
    return d.toISOString();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewlyCreatedKey(null);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">API Keys</h1>
          <p className="page-subtitle">Manage machine-to-machine authentication tokens for your workspace.</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus size={16} />} 
          onClick={() => setShowCreateModal(true)}
        >
          Create API Key
        </Button>
      </div>

      <div className="glass-card animate-slide-up" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {keys.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-10) var(--space-4)' }}>
            <div className="empty-state-icon">
              <Key size={32} />
            </div>
            <h3>No API keys found</h3>
            <p>Create an API key to authenticate servers, CI/CD pipelines, or Docker containers.</p>
            <Button variant="secondary" onClick={() => setShowCreateModal(true)} style={{ marginTop: 'var(--space-4)' }}>
              Create API Key
            </Button>
          </div>
        ) : (
          <div className="secrets-table-container">
            <table className="secrets-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key Prefix</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Last Used</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key._id} className={key.status === 'revoked' ? 'opacity-50' : ''}>
                    <td className="font-medium">{key.name}</td>
                    <td>
                      <code className="text-sm px-2 py-1 bg-surface-hover rounded" style={{ fontFamily: 'monospace' }}>
                        {key.keyPrefix}••••••••
                      </code>
                    </td>
                    <td>
                      <span className={`badge badge-${
                        key.status === 'active' ? 'success' : 
                        key.status === 'revoked' ? 'danger' : 'warning'
                      }`}>
                        {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{formatDate(key.createdAt)}</td>
                    <td className="text-muted text-sm">
                      {key.expiresAt ? formatDate(key.expiresAt) : 'Never'}
                    </td>
                    <td className="text-muted text-sm">
                      {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end" style={{ gap: 'var(--space-2)' }}>
                        <button 
                          title="Rotate key"
                          onClick={() => handleRotateKey(key)}
                          disabled={key.status === 'revoked'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: key.status === 'revoked' ? 'not-allowed' : 'pointer',
                            color: 'var(--text-secondary)',
                            opacity: key.status === 'revoked' ? 0.5 : 1,
                            padding: '4px'
                          }}
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          title="Revoke key"
                          onClick={() => {
                            setSelectedKey(key);
                            setShowRevokeModal(true);
                          }}
                          disabled={key.status === 'revoked'}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: key.status === 'revoked' ? 'not-allowed' : 'pointer',
                            color: 'var(--danger)',
                            opacity: key.status === 'revoked' ? 0.5 : 1,
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card animate-slide-up delay-2" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <h3 className="flex items-center text-bright" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <Info size={18} className="text-primary" />
          Using API Keys in CI/CD
        </h3>
        <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
          You can use Vaultix CLI with an API key to securely pull secrets into your automated pipelines without interactive login.
        </p>
        <div className="code-block" style={{ background: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px', color: 'var(--color-text)' }}>
            <span className="text-muted"># 1. Store your API Key as a GitHub Secret (e.g. VAULTIX_TOKEN)</span><br/>
            <span className="text-muted"># 2. In your workflow YAML:</span><br/><br/>
            <span style={{ color: '#cba6f7' }}>steps:</span><br/>
            <span>  - </span><span style={{ color: '#89b4fa' }}>name:</span><span> Pull Secrets</span><br/>
            <span>    </span><span style={{ color: '#89b4fa' }}>run:</span><span> |</span><br/>
            <span>      npx vaultix auth {'${{ secrets.VAULTIX_TOKEN }}'}</span><br/>
            <span>      npx vaultix pull --env production</span><br/>
          </pre>
        </div>
      </div>

      {/* Create Key Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title={newlyCreatedKey ? "API Key Created" : "Create API Key"}
      >
        {newlyCreatedKey ? (
          <div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                <AlertCircle size={20} />
                <div>
                  <strong>Save this key now.</strong>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>For your security, it will never be shown again.</p>
                </div>
              </div>
              
              <div className="input-wrapper">
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Input 
                    value={newlyCreatedKey} 
                    readOnly 
                    fullWidth 
                    className="input-field"
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}
                  />
                  <Button 
                    variant="primary" 
                    onClick={() => copyToClipboard(newlyCreatedKey, 'API Key')}
                  >
                    <Copy size={16} /> Copy
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <Button onClick={closeCreateModal} variant="secondary">Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateKey} className="modal-form">
            <div className="modal-body">
              <div className="input-wrapper">
                <label className="input-label">Key Name</label>
                <Input
                  placeholder="e.g. GitHub Actions Prod"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  autoFocus
                  fullWidth
                  required
                />
              </div>
              
              <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">Expiration</label>
                <div className="input-container">
                  <select 
                    className="input-field" 
                    value={newKeyExpires} 
                    onChange={(e) => setNewKeyExpires(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    <option value="">Never expire</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>

              <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">Permissions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px', cursor: 'pointer' }}
                      checked={newKeyPermissions['secrets.read']}
                      onChange={(e) => setNewKeyPermissions(prev => ({...prev, 'secrets.read': e.target.checked}))}
                    />
                    <span>Read Secrets</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px', cursor: 'pointer' }}
                      checked={newKeyPermissions['env.pull']}
                      onChange={(e) => setNewKeyPermissions(prev => ({...prev, 'env.pull': e.target.checked}))}
                    />
                    <span>Pull Environments</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'not-allowed', opacity: 0.5 }}>
                    <input 
                      type="checkbox" 
                      style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px' }}
                      checked={newKeyPermissions['secrets.write']}
                      onChange={(e) => setNewKeyPermissions(prev => ({...prev, 'secrets.write': e.target.checked}))}
                      disabled
                    />
                    <span>Write Secrets (Coming soon)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button type="button" variant="secondary" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={creating}>
                Create Key
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Revoke Key Modal */}
      <Modal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        title="Revoke API Key"
      >
        <p style={{ marginBottom: 'var(--space-4)' }}>
          Are you sure you want to revoke the API key <strong>{selectedKey?.name}</strong>?
        </p>
        <p className="text-danger" style={{ marginBottom: 'var(--space-6)', fontSize: '14px' }}>
          Any systems or scripts using this key will immediately lose access to Vaultix. This action cannot be undone.
        </p>
        
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setShowRevokeModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRevokeKey}>
            Revoke Key
          </Button>
        </div>
      </Modal>
    </div>
  );
}

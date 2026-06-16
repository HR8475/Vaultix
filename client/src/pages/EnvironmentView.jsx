import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import SecretModal from '../components/secrets/SecretModal';
import ImportSecretsModal from '../components/secrets/ImportSecretsModal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

export default function EnvironmentView() {
  const { workspaceId, projectId, envId } = useParams();

  // Data states
  const [workspace, setWorkspace] = useState(null);
  const [project, setProject] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [secrets, setSecrets] = useState([]);
  const [revealedSecrets, setRevealedSecrets] = useState({}); // key: secretId, value: plaintext

  // UI/UX states
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [copyAllSuccess, setCopyAllSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modal states
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState(null); // secret being edited/deleted

  // Fetch metadata (Workspace, Project, Environment)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [wsRes, projRes, envRes] = await Promise.all([
          api.get(`/workspaces/${workspaceId}`),
          api.get(`/workspaces/${workspaceId}/projects/${projectId}`),
          api.get(`/workspaces/${workspaceId}/environments/${projectId}/${envId}`),
        ]);

        setWorkspace(wsRes.data.data.workspace);
        setProject(projRes.data.data.project);
        setEnvironment(envRes.data.data.environment);
      } catch (err) {
        console.error('Error fetching environment metadata:', err);
        setError('Failed to load project/environment details');
      }
    };

    if (workspaceId && projectId && envId) {
      fetchMetadata();
    }
  }, [workspaceId, projectId, envId]);

  // Fetch secrets with optional search query
  const fetchSecrets = async () => {
    if (!workspaceId || !projectId || !envId) return;

    try {
      const url = `/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets${
        searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''
      }`;
      const res = await api.get(url);
      setSecrets(res.data.data.secrets || []);
    } catch (err) {
      console.error('Error fetching secrets:', err);
      setError(err.response?.data?.message || 'Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSecrets();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [workspaceId, projectId, envId, searchQuery]);

  // Toggle reveal value
  const handleToggleReveal = async (secretId) => {
    if (revealedSecrets[secretId]) {
      // Hide secret
      setRevealedSecrets((prev) => {
        const next = { ...prev };
        delete next[secretId];
        return next;
      });
    } else {
      // Reveal secret (fetch decrypted)
      try {
        const res = await api.get(
          `/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets/${secretId}/reveal`
        );
        setRevealedSecrets((prev) => ({
          ...prev,
          [secretId]: res.data.data.plaintext,
        }));
      } catch (err) {
        console.error('Failed to reveal secret:', err);
        alert('Error revealing secret value: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Copy individual secret value
  const handleCopySecretValue = async (secret) => {
    try {
      let plaintext = revealedSecrets[secret._id];
      if (!plaintext) {
        const res = await api.get(
          `/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets/${secret._id}/reveal`
        );
        plaintext = res.data.data.plaintext;
      }

      await navigator.clipboard.writeText(plaintext);
      setCopiedId(secret._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy secret:', err);
    }
  };

  // Copy all secrets as .env format
  const handleCopyAllEnv = async () => {
    if (secrets.length === 0) return;
    setExporting(true);
    try {
      const revealPromises = secrets.map(async (secret) => {
        const res = await api.get(
          `/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets/${secret._id}/reveal`
        );
        return `${secret.key}=${res.data.data.plaintext}`;
      });

      const lines = await Promise.all(revealPromises);
      const envContent = lines.join('\n');
      await navigator.clipboard.writeText(envContent);

      setCopyAllSuccess(true);
      setTimeout(() => setCopyAllSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to export .env:', err);
      alert('Error exporting secrets: ' + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  };

  // Handle single secret submission (Create / Update)
  const handleSecretSubmit = async (key, value) => {
    if (selectedSecret) {
      // Update Mode
      const res = await api.patch(
        `/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets/${selectedSecret._id}`,
        { value }
      );
      // Update secrets list in state
      setSecrets((prev) =>
        prev.map((s) => (s._id === selectedSecret._id ? { ...s, ...res.data.data.secret, versionCount: s.versionCount + 1 } : s))
      );
    } else {
      // Create Mode
      await api.post(
        `/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets`,
        { key, value }
      );
      // Reload list to get the proper meta structure
      fetchSecrets();
    }
    // Clear selected
    setSelectedSecret(null);
  };

  // Handle Bulk Import submission
  const handleBulkImportSubmit = async (envString) => {
    await api.post(
      `/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets/import`,
      { envString }
    );
    fetchSecrets();
  };

  // Handle Delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedSecret) return;
    await api.delete(
      `/workspaces/${workspaceId}/environments/${projectId}/${envId}/secrets/${selectedSecret._id}`
    );
    setSecrets((prev) => prev.filter((s) => s._id !== selectedSecret._id));
    // Clear reveal cache if present
    setRevealedSecrets((prev) => {
      const next = { ...prev };
      delete next[selectedSecret._id];
      return next;
    });
    setSelectedSecret(null);
  };

  if (loading && !workspace) {
    return (
      <div className="spinner-container" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner--md" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb header */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <nav className="breadcrumb" style={{ fontSize: 'var(--font-sm)' }}>
          <Link to={`/workspaces/${workspaceId}`} className="breadcrumb-item">
            {workspace?.name || 'Workspace'}
          </Link>
          <span className="breadcrumb-separator">›</span>
          <Link to={`/workspaces/${workspaceId}/projects/${projectId}`} className="breadcrumb-item">
            {project?.name || 'Project'}
          </Link>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item current">{environment?.name || 'Environment'}</span>
        </nav>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{environment?.name || 'Loading Environment...'}</h1>
          <p className="page-subtitle">
            Environment slug: <code>{environment?.slug}</code> &middot; {secrets.length} secret(s)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant="secondary"
            icon="📥"
            onClick={() => setIsImportModalOpen(true)}
          >
            Bulk Import
          </Button>
          <Button
            variant="secondary"
            icon={exporting ? '⏳' : copyAllSuccess ? '✅' : '📋'}
            onClick={handleCopyAllEnv}
            disabled={exporting || secrets.length === 0}
          >
            {exporting ? 'Decrypting...' : copyAllSuccess ? 'Copied .env!' : 'Copy .env'}
          </Button>
          <Button
            variant="primary"
            icon="➕"
            onClick={() => {
              setSelectedSecret(null);
              setIsSecretModalOpen(true);
            }}
          >
            Add Secret
          </Button>
        </div>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: 'var(--space-6)' }}>
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)' }}>
        <div className="input-container" style={{ flex: 1 }}>
          <span className="input-icon">🔍</span>
          <input
            type="text"
            className="input-field input-field--with-icon"
            placeholder="Search secrets by key name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="secondary" icon="🔄" onClick={fetchSecrets}>
          Refresh
        </Button>
      </div>

      {/* Secrets Table */}
      {secrets.length > 0 ? (
        <div
          className="secrets-table-container glass-card animate-slide-up"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <table className="secrets-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th style={{ width: 100 }}>Version</th>
                <th>Last Updated</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((secret) => {
                const isRevealed = !!revealedSecrets[secret._id];
                const displayValue = isRevealed ? revealedSecrets[secret._id] : '••••••••••••••••';

                return (
                  <tr key={secret._id}>
                    <td>
                      <span className="secret-key" title={secret.key}>
                        {secret.key}
                      </span>
                    </td>
                    <td>
                      <div className="secret-value">
                        <span style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                          {displayValue}
                        </span>
                        <button
                          className="secret-toggle"
                          onClick={() => handleToggleReveal(secret._id)}
                          title={isRevealed ? 'Hide secret value' : 'Reveal secret value'}
                          aria-label={isRevealed ? 'Hide secret value' : 'Reveal secret value'}
                        >
                          {isRevealed ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'lowercase' }}>
                        v{secret.versionCount || secret.version || 1}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary text-sm">
                        {new Date(secret.updatedAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="secret-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit Secret"
                          onClick={() => {
                            setSelectedSecret(secret);
                            setIsSecretModalOpen(true);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Copy Value"
                          onClick={() => handleCopySecretValue(secret)}
                        >
                          {copiedId === secret._id ? '✅' : '📋'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Delete Secret"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => {
                            setSelectedSecret(secret);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state glass-card animate-slide-up">
          <div className="empty-state-icon">🔑</div>
          <h3 className="empty-state-title">No secrets found</h3>
          <p className="empty-state-desc">
            {searchQuery
              ? 'No secrets match your search query. Try adjusting your filter.'
              : 'This environment does not have any secrets yet. Click Add Secret or Bulk Import to get started.'}
          </p>
          {!searchQuery && (
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button
                variant="secondary"
                icon="📥"
                onClick={() => setIsImportModalOpen(true)}
              >
                Bulk Import
              </Button>
              <Button
                variant="primary"
                icon="➕"
                onClick={() => {
                  setSelectedSecret(null);
                  setIsSecretModalOpen(true);
                }}
              >
                Add Secret
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Secret Creation & Edit Modal */}
      <SecretModal
        isOpen={isSecretModalOpen}
        onClose={() => {
          setIsSecretModalOpen(false);
          setSelectedSecret(null);
        }}
        onSubmit={handleSecretSubmit}
        secret={selectedSecret}
      />

      {/* Bulk Import Modal */}
      <ImportSecretsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSubmit={handleBulkImportSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSecret(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Secret"
        message={`Are you sure you want to delete the secret "${selectedSecret?.key}"? This will delete all versions of this secret.`}
      />
    </div>
  );
}

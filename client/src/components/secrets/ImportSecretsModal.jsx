import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function ImportSecretsModal({ isOpen, onClose, onSubmit }) {
  const [envString, setEnvString] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEnvString('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!envString.trim()) {
      setError('Please paste environment variables content');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(envString);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Secrets">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-body">
          {error && (
            <div className="auth-error" style={{ margin: 0 }}>
              {error}
            </div>
          )}

          <p className="text-secondary text-sm">
            Paste your <code>.env</code> file contents below. Keys must be unique in this environment.
            Empty lines and lines starting with <code>#</code> will be ignored. Existing keys will create a new version.
          </p>

          <div className="input-wrapper">
            <textarea
              className="input-field"
              placeholder={`# Example Env File
DATABASE_URL=postgresql://user:pass@host:5432/db
API_KEY=sk_live_123456
JWT_SECRET=super_secret`}
              value={envString}
              onChange={(e) => setEnvString(e.target.value)}
              rows={8}
              required
              autoFocus
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: 'var(--font-sm)',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Import Secrets
          </Button>
        </div>
      </form>
    </Modal>
  );
}

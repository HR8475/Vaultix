import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

export default function SecretModal({ isOpen, onClose, onSubmit, secret = null }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!secret;

  useEffect(() => {
    if (isOpen) {
      if (secret) {
        setKey(secret.key);
        setValue(''); // Don't pre-populate plaintext value for security
      } else {
        setKey('');
        setValue('');
      }
      setError('');
    }
  }, [isOpen, secret]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!key.trim()) {
      setError('Key is required');
      return;
    }
    if (!value.trim()) {
      setError('Value is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(key.trim().toUpperCase(), value);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Update Secret: ${secret.key}` : 'Create Secret'}
    >
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="modal-body">
          {error && (
            <div className="auth-error" style={{ margin: 0 }}>
              {error}
            </div>
          )}

          <Input
            label="Secret Key"
            placeholder="e.g. DATABASE_URL"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={isEdit}
            required
            autoFocus={!isEdit}
            style={{ textTransform: 'uppercase' }}
          />

          <div className="input-wrapper">
            <label className="input-label">Secret Value</label>
            <textarea
              className="input-field"
              placeholder={isEdit ? 'Enter new secret value (will create a new version)' : 'Enter secret value'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              required
              autoFocus={isEdit}
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
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
            {isEdit ? 'Update Secret' : 'Create Secret'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

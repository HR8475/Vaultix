import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Secret',
  message = 'Are you sure you want to delete this secret? This action is permanent and cannot be undone.',
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during deletion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="modal-body">
        {error && (
          <div className="auth-error" style={{ margin: 0 }}>
            {error}
          </div>
        )}
        <p className="text-secondary text-sm">{message}</p>
      </div>

      <div className="modal-footer">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

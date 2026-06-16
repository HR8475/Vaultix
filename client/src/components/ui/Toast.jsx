import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle className="toast-icon success" size={20} />,
  error: <AlertCircle className="toast-icon error" size={20} />,
  info: <Info className="toast-icon info" size={20} />,
};

const Toast = ({ message, type, onClose }) => {
  return (
    <div className={`toast toast-${type} slide-in`}>
      <div className="toast-content">
        {icons[type]}
        <span className="toast-message">{message}</span>
      </div>
      <button onClick={onClose} className="toast-close">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;

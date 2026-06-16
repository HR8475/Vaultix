import { useState } from 'react';

export default function Input({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={inputType}
          className={`input-field ${icon ? 'input-field--with-icon' : ''} ${
            error ? 'input-field--error' : ''
          }`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="input-suffix"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && (
        <span className="input-error-text">
          <span>⚠</span> {error}
        </span>
      )}
    </div>
  );
}

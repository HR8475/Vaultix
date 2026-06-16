import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Logo from '../components/ui/Logo';

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const classes = ['', 'weak', 'fair', 'good', 'strong'];
  return { score, label: labels[score], className: classes[score] };
}

export default function Signup() {
  const { signup, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      setLoading(true);
      await signup(formData.name, formData.email, formData.password);
      navigate('/');
    } catch {
      // Error is set in auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass-card">
        <div className="auth-logo">
          <Logo size={48} showText />
        </div>

        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Start managing your secrets securely</p>
        </div>

        {error && (
          <div className="auth-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Full name"
            name="name"
            type="text"
            placeholder="John Doe"
            icon="👤"
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            autoComplete="name"
          />

          <Input
            label="Email address"
            name="email"
            type="email"
            placeholder="you@example.com"
            icon="✉️"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            autoComplete="email"
          />

          <div>
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              icon="🔒"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              autoComplete="new-password"
            />
            {formData.password && (
              <>
                <div className="password-strength">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`password-strength-bar ${
                        level <= strength.score
                          ? `active ${strength.className}`
                          : ''
                      }`}
                    />
                  ))}
                </div>
                <div className="password-strength-text">
                  Password strength: {strength.label}
                </div>
              </>
            )}
          </div>

          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            icon="🔒"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Create account
          </Button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

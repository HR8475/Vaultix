import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const match = location.pathname.match(/\/workspaces\/([^/]+)/);
  const workspaceId = match ? match[1] : '';
  const basePath = workspaceId ? `/workspaces/${workspaceId}` : '';

  const navItems = [
    { to: workspaceId ? basePath : '/', icon: '📊', label: 'Dashboard', end: true },
    { to: `${basePath}/projects`, icon: '📁', label: 'Projects' },
    { to: `${basePath}/environments`, icon: '🌐', label: 'Environments' },
    { to: `${basePath}/audit`, icon: '📋', label: 'Audit Log' },
    { to: `${basePath}/settings`, icon: '⚙️', label: 'Settings' },
  ];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Logo size={32} showText />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Main Menu</span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-email">{user?.email || 'user@example.com'}</div>
          </div>
          <button
            className="sidebar-logout"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            ⏻
          </button>
        </div>
      </aside>
    </>
  );
}

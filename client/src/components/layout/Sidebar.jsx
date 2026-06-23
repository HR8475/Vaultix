import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderOpen,
  Globe,
  KeyRound,
  ScrollText,
  Settings,
  Key,
  Users,
  Puzzle,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import Logo from '../ui/Logo';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const match = location.pathname.match(/\/workspaces\/([^/]+)/);
  const workspaceId = match ? match[1] : '';
  const basePath = workspaceId ? `/workspaces/${workspaceId}` : '';

  const mainNavItems = [
    { to: workspaceId ? basePath : '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: `${basePath}/projects`, icon: <FolderOpen size={18} />, label: 'Projects' },
    { to: `${basePath}/environments`, icon: <Globe size={18} />, label: 'Environments' },
  ];

  const securityNavItems = [
    { to: `${basePath}/api-keys`, icon: <Key size={18} />, label: 'API Keys' },
    { to: `${basePath}/audit`, icon: <ScrollText size={18} />, label: 'Audit Log' },
    { to: `${basePath}/settings`, icon: <Settings size={18} />, label: 'Settings' },
  ];

  const comingSoonItems = [
    { icon: <Users size={18} />, label: 'Members' },
    { icon: <Puzzle size={18} />, label: 'Integrations' },
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
          <Logo size={28} showText />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Main</span>
          {mainNavItems.map((item) => (
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

          <div className="sidebar-divider" />
          <span className="sidebar-section-label">Security</span>
          {securityNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="sidebar-divider" />
          <span className="sidebar-section-label">Coming Soon</span>
          {comingSoonItems.map((item) => (
            <div key={item.label} className="sidebar-link sidebar-link--disabled">
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="sidebar-link-badge">
                <span className="badge badge-muted">Soon</span>
              </span>
            </div>
          ))}

          <div style={{ flex: 1 }} />

          <div className="sidebar-divider" />
          <a
            href="https://github.com/HR8475/Vaultix"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link"
            style={{ marginTop: 'var(--space-1)' }}
          >
            <span className="sidebar-link-icon"><HelpCircle size={18} /></span>
            <span>Help & Docs</span>
          </a>
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
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}

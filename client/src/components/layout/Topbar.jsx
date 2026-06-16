import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenuToggle }) {
  const location = useLocation();
  const { user } = useAuth();

  // Build breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isCurrent = index === pathSegments.length - 1;
    return { path, label, isCurrent };
  });

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-hamburger"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-item">
            🏠
          </Link>
          {breadcrumbs.length > 0 && (
            <span className="breadcrumb-separator">›</span>
          )}
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {crumb.isCurrent ? (
                <span className="breadcrumb-item current">{crumb.label}</span>
              ) : (
                <>
                  <Link to={crumb.path} className="breadcrumb-item">
                    {crumb.label}
                  </Link>
                  <span className="breadcrumb-separator">›</span>
                </>
              )}
            </span>
          ))}
          {breadcrumbs.length === 0 && (
            <span className="breadcrumb-item current">Dashboard</span>
          )}
        </nav>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <span className="topbar-search-icon">🔍</span>
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search secrets..."
            aria-label="Search"
          />
        </div>

        <button className="topbar-icon-btn" aria-label="Notifications">
          🔔
          <span className="topbar-notification-dot" />
        </button>

        <div className="topbar-avatar" title={user?.name || 'User'}>
          {initials}
        </div>
      </div>
    </header>
  );
}

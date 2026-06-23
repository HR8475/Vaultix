import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Plus, ChevronDown, Menu } from 'lucide-react';
import api from '../../services/api';

export default function Topbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Extract current workspace ID from URL
  const match = location.pathname.match(/\/workspaces\/([^/]+)/);
  const currentWorkspaceId = match ? match[1] : '';

  // Fetch all workspaces for the switcher
  useEffect(() => {
    api
      .get('/workspaces')
      .then((res) => {
        setWorkspaces(res.data.data?.workspaces || []);
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentWorkspace = workspaces.find((w) => w._id === currentWorkspaceId);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleWorkspaceSwitch = (wsId) => {
    setDropdownOpen(false);
    navigate(`/workspaces/${wsId}`);
  };

  // Build breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isCurrent = index === pathSegments.length - 1;
    return { path, label, isCurrent };
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-hamburger"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>

        {/* Workspace switcher */}
        {workspaces.length > 0 && (
          <div className="workspace-switcher" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span className="workspace-switcher-name">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
            <span className="workspace-switcher-icon">
              <ChevronDown size={14} />
            </span>

            {dropdownOpen && (
              <div className="workspace-dropdown">
                {workspaces.map((ws) => (
                  <div
                    key={ws._id}
                    className={`workspace-dropdown-item ${ws._id === currentWorkspaceId ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWorkspaceSwitch(ws._id);
                    }}
                  >
                    {ws.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Breadcrumb fallback when no workspaces */}
        {workspaces.length === 0 && (
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-item">Dashboard</Link>
            {breadcrumbs.length > 0 && (
              <span className="breadcrumb-separator">›</span>
            )}
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.path} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
          </nav>
        )}
      </div>

      {/* Center search */}
      <div className="topbar-center">
        <div className="topbar-search">
          <span className="topbar-search-icon">
            <Search size={14} />
          </span>
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search secrets, projects..."
            aria-label="Search"
          />
          <span className="topbar-search-shortcut">⌘K</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* New Secret button */}
        {currentWorkspaceId && (
          <Link
            to={`/workspaces/${currentWorkspaceId}/environments`}
            className="topbar-new-btn"
          >
            <Plus size={14} />
            <span>New Secret</span>
          </Link>
        )}

        <button className="topbar-icon-btn" aria-label="Notifications">
          <Bell size={16} />
          <span className="topbar-notification-dot" />
        </button>

        <div className="topbar-avatar" title={user?.name || 'User'}>
          {initials}
        </div>
      </div>
    </header>
  );
}

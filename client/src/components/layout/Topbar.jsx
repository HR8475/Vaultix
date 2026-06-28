import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search, Bell, Plus, ChevronDown, Menu, FolderOpen, Globe,
  ArrowRight, LogOut, Settings, ScrollText, User, KeyRound,
  ShieldCheck, Clock,
} from 'lucide-react';
import api from '../../services/api';

export default function Topbar({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [allEnvironments, setAllEnvironments] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const notifRef = useRef(null);

  // Profile dropdown state
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

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

  // Fetch projects and environments for search when workspace changes
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const fetchSearchData = async () => {
      try {
        const projectsRes = await api.get(`/workspaces/${currentWorkspaceId}/projects`);
        const projs = projectsRes.data.data.projects || [];
        setAllProjects(projs);

        const envPromises = projs.map(async (project) => {
          try {
            const envRes = await api.get(`/workspaces/${currentWorkspaceId}/environments/${project._id}`);
            const envs = envRes.data.data.environments || [];
            return envs.map((env) => ({
              ...env,
              projectId: project._id,
              projectName: project.name,
            }));
          } catch {
            return [];
          }
        });

        const envResults = await Promise.all(envPromises);
        setAllEnvironments(envResults.flat());
      } catch {
        setAllProjects([]);
        setAllEnvironments([]);
      }
    };

    fetchSearchData();
  }, [currentWorkspaceId]);

  // Filter search results based on query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setActiveIndex(-1);
      return;
    }

    const q = searchQuery.toLowerCase();
    const results = [];

    allProjects.forEach((project) => {
      if (
        project.name.toLowerCase().includes(q) ||
        (project.description && project.description.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'project',
          id: project._id,
          name: project.name,
          description: project.description || 'No description',
          path: `/workspaces/${currentWorkspaceId}/projects/${project._id}`,
        });
      }
    });

    allEnvironments.forEach((env) => {
      if (
        env.name.toLowerCase().includes(q) ||
        env.projectName.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'environment',
          id: env._id,
          name: env.name,
          description: `in ${env.projectName}`,
          path: `/workspaces/${currentWorkspaceId}/environments/${env.projectId}/${env._id}`,
        });
      }
    });

    setSearchResults(results.slice(0, 8));
    setActiveIndex(-1);
  }, [searchQuery, allProjects, allEnvironments, currentWorkspaceId]);

  // Fetch notifications (audit logs)
  const fetchNotifications = async () => {
    if (!currentWorkspaceId) return;
    setNotifLoading(true);
    try {
      const res = await api.get(`/workspaces/${currentWorkspaceId}/audit`);
      const logs = res.data.data.logs || [];
      setNotifications(logs.slice(0, 10));
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotifToggle = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setProfileOpen(false);
    if (opening) {
      setHasUnread(false);
      fetchNotifications();
    }
  };

  const handleProfileToggle = () => {
    setProfileOpen((prev) => !prev);
    setNotifOpen(false);
  };

  // Close all dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0 && searchResults[activeIndex]) {
        e.preventDefault();
        navigateToResult(searchResults[activeIndex]);
      }
    },
    [searchResults, activeIndex]
  );

  const navigateToResult = (result) => {
    navigate(result.path);
    setSearchQuery('');
    setSearchOpen(false);
    searchInputRef.current?.blur();
  };

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

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isCurrent = index === pathSegments.length - 1;
    return { path, label, isCurrent };
  });

  // Icon for audit action type
  const getActionIcon = (action) => {
    if (!action) return <Clock size={14} />;
    const a = action.toLowerCase();
    if (a.includes('secret')) return <KeyRound size={14} />;
    if (a.includes('project')) return <FolderOpen size={14} />;
    if (a.includes('environment')) return <Globe size={14} />;
    if (a.includes('member') || a.includes('invite')) return <User size={14} />;
    if (a.includes('api') || a.includes('key')) return <ShieldCheck size={14} />;
    return <Clock size={14} />;
  };

  // Relative time
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

        {/* Breadcrumb fallback */}
        {workspaces.length === 0 && (
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-item">Dashboard</Link>
            {breadcrumbs.length > 0 && (
              <span className="breadcrumb-separator">›</span>
            )}
            {breadcrumbs.map((crumb) => (
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
      <div className="topbar-center" ref={searchRef}>
        <div className={`topbar-search ${searchOpen && searchResults.length > 0 ? 'topbar-search--active' : ''}`}>
          <span className="topbar-search-icon">
            <Search size={14} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            className="topbar-search-input"
            placeholder="Search projects, environments..."
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
          />
          <span className="topbar-search-shortcut">⌘K</span>
        </div>

        {searchOpen && searchQuery.trim() && (
          <div className="search-dropdown">
            {searchResults.length === 0 ? (
              <div className="search-dropdown-empty">
                <Search size={16} style={{ opacity: 0.3 }} />
                <span>No results for &ldquo;{searchQuery}&rdquo;</span>
              </div>
            ) : (
              <>
                <div className="search-dropdown-header">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map((result, i) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`search-dropdown-item ${i === activeIndex ? 'search-dropdown-item--active' : ''}`}
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <div className="search-dropdown-item-icon">
                      {result.type === 'project' ? <FolderOpen size={15} /> : <Globe size={15} />}
                    </div>
                    <div className="search-dropdown-item-info">
                      <div className="search-dropdown-item-name">{result.name}</div>
                      <div className="search-dropdown-item-desc">{result.description}</div>
                    </div>
                    <span className="search-dropdown-item-type">
                      {result.type === 'project' ? 'Project' : 'Environment'}
                    </span>
                    <ArrowRight size={14} className="search-dropdown-item-arrow" />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
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

        {/* Notifications bell */}
        <div className="topbar-dropdown-wrapper" ref={notifRef}>
          <button
            className={`topbar-icon-btn ${notifOpen ? 'topbar-icon-btn--active' : ''}`}
            aria-label="Notifications"
            onClick={handleNotifToggle}
          >
            <Bell size={16} />
            {hasUnread && <span className="topbar-notification-dot" />}
          </button>

          {notifOpen && (
            <div className="topbar-panel topbar-panel--notif">
              <div className="topbar-panel-header">
                <span className="topbar-panel-title">Notifications</span>
                {currentWorkspaceId && (
                  <Link
                    to={`/workspaces/${currentWorkspaceId}/audit`}
                    className="topbar-panel-action"
                    onClick={() => setNotifOpen(false)}
                  >
                    View all
                  </Link>
                )}
              </div>
              <div className="topbar-panel-body">
                {notifLoading ? (
                  <div className="topbar-panel-loading">
                    <div className="spinner spinner--sm" />
                    <span>Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="topbar-panel-empty">
                    <Bell size={20} style={{ opacity: 0.2 }} />
                    <span>No recent activity</span>
                  </div>
                ) : (
                  notifications.map((log) => (
                    <div key={log._id} className="notif-item">
                      <div className="notif-item-icon">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-text">
                          <span className="notif-item-user">
                            {log.user?.name || log.user?.email || 'System'}
                          </span>
                          {' '}{log.action?.replace(/_/g, ' ').toLowerCase() || 'performed an action'}
                        </div>
                        <div className="notif-item-time">{timeAgo(log.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile avatar */}
        <div className="topbar-dropdown-wrapper" ref={profileRef}>
          <div
            className={`topbar-avatar ${profileOpen ? 'topbar-avatar--active' : ''}`}
            title={user?.name || 'User'}
            onClick={handleProfileToggle}
          >
            {initials}
          </div>

          {profileOpen && (
            <div className="topbar-panel topbar-panel--profile">
              <div className="topbar-panel-user">
                <div className="topbar-panel-avatar">
                  {initials}
                </div>
                <div className="topbar-panel-user-info">
                  <div className="topbar-panel-user-name">{user?.name || 'User'}</div>
                  <div className="topbar-panel-user-email">{user?.email || 'user@example.com'}</div>
                </div>
              </div>

              <div className="topbar-panel-divider" />

              <div className="topbar-panel-menu">
                {currentWorkspaceId && (
                  <>
                    <Link
                      to={`/workspaces/${currentWorkspaceId}/settings`}
                      className="topbar-panel-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings size={15} />
                      <span>Settings</span>
                    </Link>
                    <Link
                      to={`/workspaces/${currentWorkspaceId}/api-keys`}
                      className="topbar-panel-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <ShieldCheck size={15} />
                      <span>API Keys</span>
                    </Link>
                    <Link
                      to={`/workspaces/${currentWorkspaceId}/audit`}
                      className="topbar-panel-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <ScrollText size={15} />
                      <span>Audit Log</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="topbar-panel-divider" />

              <button
                className="topbar-panel-menu-item topbar-panel-menu-item--danger"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

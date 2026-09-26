import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Trophy, LayoutDashboard, Swords, Medal, LogOut, Shield, Flame, Star, Gem, ChevronDown, User } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    if (dropdownOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [dropdownOpen]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <nav className="navbar" id="main-nav">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand" id="nav-brand">
          <Star className="brand-icon" size={24} />
          <span>Brilliance</span>
        </NavLink>

        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end id="nav-dashboard">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/quiz" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-quiz">
            <Swords size={18} />
            <span>Play</span>
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-leaderboard">
            <Trophy size={18} />
            <span>Leaderboard</span>
          </NavLink>
          <NavLink to="/badges" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-badges">
            <Medal size={18} />
            <span>Badges</span>
          </NavLink>
          <NavLink to="/gems" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-gems">
            <Gem size={18} />
            <span>Gems</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-admin">
              <Shield size={18} />
              <span>Admin</span>
            </NavLink>
          )}
        </div>

        <div className="navbar-user">
          <div className="user-stats">
            <span className="stat-badge xp">
              <Star size={14} />
              {user.totalXp || 0} XP
            </span>
            <span className="stat-badge gems">
              <Gem size={14} />
              {user.totalGems || 0}
            </span>
            <div className="streak-calendar-wrapper">
              <button
                className={`streak-trigger-btn ${streakOpen ? 'open' : ''}`}
                onClick={() => setStreakOpen(prev => !prev)}
                id="streak-calendar-trigger"
              >
                <Flame size={14} />
                {user.currentStreak || 0}
              </button>
              {streakOpen && (
                <StreakCalendar
                  currentStreak={user.currentStreak || 0}
                  onClose={() => setStreakOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Avatar dropdown */}
          <div className="avatar-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="avatar-dropdown-trigger"
              onClick={() => setDropdownOpen(prev => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              id="nav-avatar-menu"
            >
              <div className="user-avatar-group">
                <img
                  src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.avatarSeed || user.username}`}
                  alt={user.displayName}
                  className="user-avatar"
                />
                <span className="user-level">Lv.{user.currentLevel || 1}</span>
              </div>
              <ChevronDown
                size={14}
                className={`avatar-chevron ${dropdownOpen ? 'open' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="avatar-dropdown-menu" role="menu">
                <div className="dropdown-user-info">
                  <span className="dropdown-display-name">{user.displayName}</span>
                  <span className="dropdown-username">@{user.username}</span>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={handleProfile} role="menuitem" id="nav-profile">
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <button className="dropdown-item danger" onClick={handleLogout} role="menuitem" id="nav-logout">
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Trophy, LayoutDashboard, Swords, Medal, LogOut, Shield, Flame, Star } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            <span className="stat-badge streak">
              <Flame size={14} />
              {user.currentStreak || 0}
            </span>
          </div>
          <div className="user-avatar-group">
            <img
              src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.avatarSeed || user.username}`}
              alt={user.displayName}
              className="user-avatar"
            />
            <span className="user-level">Lv.{user.currentLevel || 1}</span>
          </div>
          <button className="nav-link logout-btn" onClick={handleLogout} title="Logout" id="nav-logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}

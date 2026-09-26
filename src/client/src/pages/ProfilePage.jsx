import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Star, Flame, Trophy, Zap, Target, Calendar, TrendingUp, Award, User, Clock, BarChart3 } from 'lucide-react';
import './Profile.css';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [scores, setScores] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [scoresData, badgesData] = await Promise.all([
          api.getMyScores(),
          api.getMyBadges(),
        ]);
        setScores(scoresData);
        setBadges(badgesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-loader"><span className="spinner large" /></div>;

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  const xpToNext = scores?.xpToNextLevel || 0;
  const levelXp = (user?.currentLevel || 1) * 300;
  const xpProgress = levelXp > 0 ? ((levelXp - xpToNext) / levelXp) * 100 : 0;

  return (
    <div className="profile-page container">
      {/* Profile Header */}
      <motion.section className="profile-header glass-card" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            <img
              src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user?.avatarSeed || user?.username}`}
              alt={user?.displayName}
              className="profile-avatar"
            />
            <div className="profile-level-badge">Lv. {user?.currentLevel || 1}</div>
          </div>
          <div className="profile-identity">
            <h1 className="profile-name">{user?.displayName || 'Learner'}</h1>
            <p className="profile-username">@{user?.username}</p>
            <span className="profile-role-badge">{user?.role === 'admin' ? '🛡️ Admin' : '🎓 Learner'}</span>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.section className="profile-stats" variants={container} initial="hidden" animate="show">
        <motion.div className="profile-stat glass-card" variants={item}>
          <div className="profile-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <Star size={20} color="#FBBF24" />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-value">{(user?.totalXp || 0).toLocaleString()}</span>
            <span className="profile-stat-label">Total XP</span>
          </div>
        </motion.div>

        <motion.div className="profile-stat glass-card" variants={item}>
          <div className="profile-stat-icon" style={{ background: 'rgba(108, 99, 255, 0.15)' }}>
            <Zap size={20} color="#8B83FF" />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-value">Level {user?.currentLevel || 1}</span>
            <span className="profile-stat-label">Current Level</span>
          </div>
        </motion.div>

        <motion.div className="profile-stat glass-card" variants={item}>
          <div className="profile-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <Flame size={20} color="#f87171" />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-value">{user?.currentStreak || 0} Days</span>
            <span className="profile-stat-label">Current Streak</span>
          </div>
        </motion.div>

        <motion.div className="profile-stat glass-card" variants={item}>
          <div className="profile-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <TrendingUp size={20} color="#FBBF24" />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-value">{user?.longestStreak || 0} Days</span>
            <span className="profile-stat-label">Longest Streak</span>
          </div>
        </motion.div>

        <motion.div className="profile-stat glass-card" variants={item}>
          <div className="profile-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <Trophy size={20} color="#10B981" />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-value">{scores?.totalQuizzesCompleted || 0}</span>
            <span className="profile-stat-label">Quizzes Completed</span>
          </div>
        </motion.div>

        <motion.div className="profile-stat glass-card" variants={item}>
          <div className="profile-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
            <Star size={20} color="#ec4899" />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-value">{user?.gems || 0}</span>
            <span className="profile-stat-label">Gems Earned</span>
          </div>
        </motion.div>

        <motion.div className="profile-stat glass-card" variants={item}>
          <div className="profile-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
            <Award size={20} color="#a78bfa" />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-value">{badges.length || 0}</span>
            <span className="profile-stat-label">Badges Earned</span>
          </div>
        </motion.div>
      </motion.section>

      {/* XP Progress */}
      <motion.section className="profile-progress glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="profile-progress-header">
          <span className="profile-progress-title">
            <BarChart3 size={18} />
            Level Progress
          </span>
          <span className="profile-progress-detail">
            {xpToNext > 0 ? `${xpToNext} XP to Level ${(user?.currentLevel || 1) + 1}` : 'Max level!'}
          </span>
        </div>
        <div className="profile-progress-track">
          <motion.div
            className="profile-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(xpProgress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
          />
        </div>
      </motion.section>

      {/* Badges showcase */}
      {badges.length > 0 && (
        <motion.section className="profile-badges-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="profile-section-title">
            <Award size={20} />
            Badges Earned
          </h2>
          <div className="profile-badges-grid">
            {badges.map((badge) => (
              <motion.div
                key={badge.id}
                className={`profile-badge glass-card rarity-${badge.rarity}`}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <span className="profile-badge-icon">{badge.icon || '🏅'}</span>
                <span className="profile-badge-name">{badge.name}</span>
                <span className="profile-badge-rarity">{badge.rarity}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

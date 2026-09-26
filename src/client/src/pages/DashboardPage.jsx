import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Star, Flame, Trophy, Zap, Target, BookOpen, Clock, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const { user, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const [scores, setScores] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [scoresData, topicsData] = await Promise.all([
          api.getMyScores(),
          api.getTopics(),
        ]);
        setScores(scoresData);
        setTopics(topicsData);
        refreshUser();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-loader"><span className="spinner large" /></div>;

  const xpToNext = scores?.xpToNextLevel || 0;
  const totalXp = user?.totalXp || 0;
  const levelXp = (user?.currentLevel || 1) * 300;
  const xpProgress = levelXp > 0 ? ((levelXp - xpToNext) / levelXp) * 100 : 0;

  return (
    <div className="dashboard-page container">
      {/* Hero welcome */}
      <motion.section className="dash-hero" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-text">
          <h1>Welcome back, <span className="gradient-text">{user?.displayName || 'Learner'}</span> 👋</h1>
          <p>Continue your learning streak and earn XP!</p>
        </div>
        <div className="hero-avatar">
          <img
            src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user?.avatarSeed || user?.username}`}
            alt="Avatar"
            className="avatar-large"
          />
          <div className="avatar-level">Level {user?.currentLevel || 1}</div>
        </div>
      </motion.section>

      {/* Stats row */}
      <motion.section className="stats-grid" variants={container} initial="hidden" animate="show">
        <motion.div className="stat-card glass-card" variants={item}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <Star size={22} color="#FBBF24" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalXp.toLocaleString()}</span>
            <span className="stat-label">Total XP</span>
          </div>
        </motion.div>

        <motion.div className="stat-card glass-card" variants={item}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <Flame size={22} color="#f87171" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{user?.currentStreak || 0}</span>
            <span className="stat-label">Day Streak 🔥</span>
          </div>
        </motion.div>

        <motion.div className="stat-card glass-card" variants={item}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <Trophy size={22} color="#10B981" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{scores?.totalQuizzesCompleted || 0}</span>
            <span className="stat-label">Quizzes Done</span>
          </div>
        </motion.div>

        <motion.div className="stat-card glass-card" variants={item}>
          <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.15)' }}>
            <Zap size={22} color="#8B83FF" />
          </div>
          <div className="stat-info">
            <span className="stat-value">Lv.{user?.currentLevel || 1}</span>
            <span className="stat-label">Current Level</span>
          </div>
        </motion.div>
      </motion.section>

      {/* XP Progress bar */}
      <motion.section className="xp-section glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="xp-header">
          <span className="xp-title">
            <TrendingUp size={18} />
            Level Progress
          </span>
          <span className="xp-detail">{xpToNext > 0 ? `${xpToNext} XP to Level ${(user?.currentLevel || 1) + 1}` : 'Max level!'}</span>
        </div>
        <div className="xp-bar-track">
          <motion.div
            className="xp-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(xpProgress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
          />
        </div>
      </motion.section>

      {/* Topic cards */}
      <section className="topics-section">
        <h2 className="section-title">
          <BookOpen size={20} />
          Choose a Topic
        </h2>
        <motion.div className="topics-grid" variants={container} initial="hidden" animate="show">
          {topics.map((topic) => (
            <motion.div
              key={topic.id}
              className="topic-card glass-card"
              variants={item}
              onClick={() => navigate(`/quiz?topic=${topic.id}`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ '--topic-color': topic.color }}
            >
              <div className="topic-icon" style={{ background: `${topic.color}20` }}>
                <span className="topic-emoji">{topic.icon}</span>
              </div>
              <h3>{topic.name}</h3>
              <p className="topic-desc">{topic.description}</p>
              <div className="topic-meta">
                <span><Target size={14} /> {topic.quiz_count} quizzes</span>
              </div>
              <div className="topic-glow" style={{ background: topic.color }} />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Recent attempts */}
      {scores?.recentAttempts?.length > 0 && (
        <section className="recent-section">
          <h2 className="section-title">
            <Clock size={20} />
            Recent Activity
          </h2>
          <div className="recent-list">
            {scores.recentAttempts.slice(0, 5).map((a, i) => {
              const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
              return (
                <motion.div
                  key={a.id || i}
                  className="recent-item glass-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  <span className="recent-icon">{a.icon || '📝'}</span>
                  <div className="recent-info">
                    <span className="recent-title">{a.quiz_title}</span>
                    <span className="recent-topic">{a.topic_name}</span>
                  </div>
                  <div className="recent-score">
                    <span className={`score-pct ${pct >= 80 ? 'great' : pct >= 50 ? 'ok' : 'low'}`}>
                      {pct}%
                    </span>
                    <span className="score-xp">+{a.xp_earned} XP</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

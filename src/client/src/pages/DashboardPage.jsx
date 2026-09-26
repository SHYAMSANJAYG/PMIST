import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flame, Trophy, Zap, Target, BookOpen, Clock, TrendingUp, ChevronDown, CheckCircle, XCircle, HelpCircle, Lightbulb } from 'lucide-react';
import './Dashboard.css';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const { user, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const [scores, setScores] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [reviewData, setReviewData] = useState({});
  const [reviewLoading, setReviewLoading] = useState(null);

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

  const toggleReview = async (attemptId) => {
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null);
      return;
    }

    setExpandedAttempt(attemptId);

    // Only fetch if not cached
    if (!reviewData[attemptId]) {
      setReviewLoading(attemptId);
      try {
        const data = await api.getAttemptReview(attemptId);
        setReviewData(prev => ({ ...prev, [attemptId]: data }));
      } catch (err) {
        console.error('Failed to load review:', err);
      } finally {
        setReviewLoading(null);
      }
    }
  };

  const getOptionLabel = (key) => {
    const labels = { A: 'A', B: 'B', C: 'C', D: 'D' };
    return labels[key] || key;
  };

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

      {/* Recent attempts with expandable review */}
      {scores?.recentAttempts?.length > 0 && (
        <section className="recent-section">
          <h2 className="section-title">
            <Clock size={20} />
            Recent Activity
          </h2>
          <p className="recent-hint">Click on a quiz to view your question-by-question analysis</p>
          <div className="recent-list">
            {scores.recentAttempts.slice(0, 5).map((a, i) => {
              const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
              const isExpanded = expandedAttempt === a.id;
              const review = reviewData[a.id];
              const isLoadingReview = reviewLoading === a.id;

              return (
                <motion.div
                  key={a.id || i}
                  className="recent-item-wrapper"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                >
                  {/* Clickable header */}
                  <div
                    className={`recent-item glass-card ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleReview(a.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleReview(a.id)}
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
                    <motion.div
                      className="expand-chevron"
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} />
                    </motion.div>
                  </div>

                  {/* Expandable review panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="review-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        {isLoadingReview ? (
                          <div className="review-loading">
                            <span className="spinner" />
                            <span>Loading quiz analysis...</span>
                          </div>
                        ) : review ? (
                          <div className="review-content">
                            {/* Summary bar */}
                            <div className="review-summary">
                              <div className="review-summary-stat">
                                <CheckCircle size={16} color="#10B981" />
                                <span>{review.summary.correctCount} Correct</span>
                              </div>
                              <div className="review-summary-stat">
                                <XCircle size={16} color="#ef4444" />
                                <span>{review.summary.incorrectCount} Incorrect</span>
                              </div>
                              <div className="review-summary-stat">
                                <HelpCircle size={16} color="#8B83FF" />
                                <span>{review.summary.totalQuestions} Total</span>
                              </div>
                              <div className="review-summary-stat">
                                <Star size={16} color="#FBBF24" />
                                <span>{review.attempt.xpEarned} XP</span>
                              </div>
                            </div>

                            {/* Question-by-question analysis */}
                            <div className="review-questions">
                              {review.questions.map((q) => (
                                <div key={q.questionId} className={`review-question ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                                  <div className="review-q-header">
                                    <span className="review-q-number">Q{q.number}</span>
                                    <span className="review-q-status">
                                      {q.isCorrect
                                        ? <CheckCircle size={16} color="#10B981" />
                                        : <XCircle size={16} color="#ef4444" />
                                      }
                                    </span>
                                  </div>
                                  <p className="review-q-text">{q.questionText}</p>

                                  {/* Options list */}
                                  <div className="review-options">
                                    {Object.entries(q.options).map(([key, value]) => {
                                      if (!value) return null;
                                      const isUserAnswer = q.userAnswer === key;
                                      const isCorrectAnswer = q.correctAnswer === key;
                                      let optionClass = 'review-option';
                                      if (isCorrectAnswer) optionClass += ' correct-option';
                                      if (isUserAnswer && !q.isCorrect) optionClass += ' wrong-option';
                                      if (isUserAnswer && q.isCorrect) optionClass += ' correct-option';

                                      return (
                                        <div key={key} className={optionClass}>
                                          <span className="option-letter">{getOptionLabel(key)}</span>
                                          <span className="option-text">{value}</span>
                                          {isCorrectAnswer && <CheckCircle size={14} className="option-badge correct-badge" />}
                                          {isUserAnswer && !q.isCorrect && <XCircle size={14} className="option-badge wrong-badge" />}
                                          {isUserAnswer && q.isCorrect && <span className="option-tag you">Your answer ✓</span>}
                                          {isCorrectAnswer && !isUserAnswer && <span className="option-tag answer">Correct answer</span>}
                                          {isUserAnswer && !q.isCorrect && <span className="option-tag you-wrong">Your answer</span>}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Explanation */}
                                  {q.explanation && (
                                    <div className="review-explanation">
                                      <Lightbulb size={14} />
                                      <span>{q.explanation}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="review-loading">
                            <span>Unable to load review data</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

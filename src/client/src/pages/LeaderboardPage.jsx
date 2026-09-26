import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Star, Flame, Award } from 'lucide-react';
import './Leaderboard.css';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTopics().then(setTopics).catch(console.error);
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async (topicId = null) => {
    setLoading(true);
    try {
      const data = topicId
        ? await api.getTopicLeaderboard(topicId)
        : await api.getLeaderboard(50);
      setLeaderboard(data);
      setSelectedTopic(topicId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={20} color="#FBBF24" />;
    if (rank === 2) return <Medal size={20} color="#C0C0C0" />;
    if (rank === 3) return <Medal size={20} color="#CD7F32" />;
    return <span className="rank-number">{rank}</span>;
  };

  return (
    <div className="leaderboard-page container">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title-main">
          <Trophy size={28} />
          Leaderboard
        </h1>
        <p className="page-subtitle">See how you stack up against other learners</p>
      </motion.div>

      {/* Topic filter */}
      <div className="lb-filters">
        <button
          className={`filter-btn ${!selectedTopic ? 'active' : ''}`}
          onClick={() => loadLeaderboard()}
          id="filter-global"
        >
          🌐 Global
        </button>
        {topics.map((t) => (
          <button
            key={t.id}
            className={`filter-btn ${selectedTopic === t.id ? 'active' : ''}`}
            onClick={() => loadLeaderboard(t.id)}
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loader"><span className="spinner large" /></div>
      ) : (
        <div className="lb-table-wrapper glass-card">
          <table className="lb-table" id="leaderboard-table">
            <thead>
              <tr>
                <th className="th-rank">Rank</th>
                <th className="th-user">Player</th>
                {!selectedTopic ? (
                  <>
                    <th className="th-xp">XP</th>
                    <th className="th-level">Level</th>
                    <th className="th-streak">Streak</th>
                    <th className="th-badges">Badges</th>
                    <th className="th-quizzes">Quizzes</th>
                  </>
                ) : (
                  <>
                    <th className="th-score">Avg Score</th>
                    <th className="th-attempts">Attempts</th>
                    <th className="th-mastery">Mastery</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => {
                const isMe = entry.id === user?.id;
                return (
                  <motion.tr
                    key={entry.id}
                    className={`lb-row ${isMe ? 'is-me' : ''} ${entry.rank <= 3 ? `top-${entry.rank}` : ''}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="td-rank">
                      <div className="rank-badge">{getRankIcon(entry.rank)}</div>
                    </td>
                    <td className="td-user">
                      <img
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${entry.avatar_seed || entry.username}`}
                        alt=""
                        className="lb-avatar"
                      />
                      <div className="lb-user-info">
                        <span className="lb-name">
                          {entry.display_name}
                          {isMe && <span className="you-badge">YOU</span>}
                        </span>
                        <span className="lb-username">@{entry.username}</span>
                      </div>
                    </td>
                    {!selectedTopic ? (
                      <>
                        <td className="td-xp">
                          <Star size={14} color="#FBBF24" /> {(entry.total_xp || 0).toLocaleString()}
                        </td>
                        <td className="td-level">Lv.{entry.current_level || 1}</td>
                        <td className="td-streak">
                          <Flame size={14} color="#f87171" /> {entry.current_streak || 0}
                        </td>
                        <td className="td-badges">
                          <Award size={14} color="#8B83FF" /> {entry.badge_count || 0}
                        </td>
                        <td className="td-quizzes">{entry.quizzes_completed || 0}</td>
                      </>
                    ) : (
                      <>
                        <td className="td-score">{Math.round(entry.avg_score || 0)}%</td>
                        <td className="td-attempts">{entry.total_attempts || 0}</td>
                        <td className="td-mastery">
                          <span className={`mastery-tag ${entry.mastery_level}`}>
                            {entry.mastery_level || 'beginner'}
                          </span>
                        </td>
                      </>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {leaderboard.length === 0 && (
            <div className="lb-empty">No data yet. Be the first to play!</div>
          )}
        </div>
      )}
    </div>
  );
}

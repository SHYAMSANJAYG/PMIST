import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Medal, Lock, Sparkles, Star, Flame, BookOpen, Target } from 'lucide-react';
import './Badges.css';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } };

export default function BadgesPage() {
  const { user } = useAuthStore();
  const [badgeData, setBadgeData] = useState({ earned: [], unearned: [], total: 0 });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [badges, me] = await Promise.all([api.getMyBadges(), api.getMe()]);
        setBadgeData(badges);
        setProfile(me);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-loader"><span className="spinner large" /></div>;

  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sortedEarned = [...(badgeData.earned || [])].sort((a, b) => (rarityOrder[a.rarity] || 3) - (rarityOrder[b.rarity] || 3));
  const sortedUnearned = [...(badgeData.unearned || [])].sort((a, b) => (rarityOrder[a.rarity] || 3) - (rarityOrder[b.rarity] || 3));

  return (
    <div className="badges-page container">
      {/* Profile header */}
      <motion.section className="profile-header glass-card" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-avatar-section">
          <img
            src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user?.avatarSeed || user?.username}`}
            alt="Avatar"
            className="profile-avatar"
          />
          <div className="profile-level-ring" />
        </div>
        <div className="profile-info">
          <h1>{profile?.displayName || user?.displayName}</h1>
          <span className="profile-username">@{profile?.username || user?.username}</span>
        </div>
        <div className="profile-stats-row">
          <div className="ps-stat">
            <Star size={16} color="#FBBF24" />
            <span className="ps-val">{(profile?.totalXp || 0).toLocaleString()}</span>
            <span className="ps-lbl">XP</span>
          </div>
          <div className="ps-stat">
            <Target size={16} color="#8B83FF" />
            <span className="ps-val">Lv.{profile?.currentLevel || 1}</span>
            <span className="ps-lbl">Level</span>
          </div>
          <div className="ps-stat">
            <Flame size={16} color="#f87171" />
            <span className="ps-val">{profile?.currentStreak || 0}</span>
            <span className="ps-lbl">Streak</span>
          </div>
          <div className="ps-stat">
            <Medal size={16} color="#10B981" />
            <span className="ps-val">{badgeData.earned?.length || 0}/{badgeData.total}</span>
            <span className="ps-lbl">Badges</span>
          </div>
        </div>
      </motion.section>

      {/* Topic mastery */}
      {profile?.topicStats?.length > 0 && (
        <section className="topic-mastery-section">
          <h2 className="section-title"><BookOpen size={20} /> Topic Mastery</h2>
          <div className="mastery-grid">
            {profile.topicStats.map((ts) => (
              <div key={ts.topic_id} className="mastery-card glass-card" style={{ '--topic-color': ts.color }}>
                <div className="mastery-top">
                  <span className="mastery-icon">{ts.icon}</span>
                  <span className={`mastery-level-tag ${ts.mastery_level}`}>{ts.mastery_level}</span>
                </div>
                <h4>{ts.topic_name}</h4>
                <div className="mastery-bar-track">
                  <div
                    className="mastery-bar-fill"
                    style={{ width: `${Math.min(ts.avg_score || 0, 100)}%`, background: ts.color }}
                  />
                </div>
                <div className="mastery-meta">
                  <span>Avg: {Math.round(ts.avg_score || 0)}%</span>
                  <span>Attempts: {ts.total_attempts || 0}</span>
                  <span>D{ts.current_difficulty || 1}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Earned badges */}
      <section className="badges-section">
        <h2 className="section-title">
          <Sparkles size={20} />
          Earned Badges ({sortedEarned.length})
        </h2>
        {sortedEarned.length > 0 ? (
          <motion.div className="badges-grid" variants={container} initial="hidden" animate="show">
            {sortedEarned.map((b) => (
              <motion.div key={b.id} className={`badge-card glass-card rarity-${b.rarity}`} variants={item}>
                <div className="badge-glow-effect" />
                <span className="badge-icon-xl">{b.icon}</span>
                <h4>{b.name}</h4>
                <p>{b.description}</p>
                <div className="badge-meta">
                  <span className={`rarity-tag ${b.rarity}`}>{b.rarity}</span>
                  {b.xp_bonus > 0 && <span className="xp-bonus">+{b.xp_bonus} XP</span>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="badges-empty glass-card">
            <Medal size={48} />
            <p>No badges yet! Complete quizzes and build streaks to earn badges.</p>
          </div>
        )}
      </section>

      {/* Locked badges */}
      {sortedUnearned.length > 0 && (
        <section className="badges-section">
          <h2 className="section-title">
            <Lock size={20} />
            Locked Badges ({sortedUnearned.length})
          </h2>
          <motion.div className="badges-grid" variants={container} initial="hidden" animate="show">
            {sortedUnearned.map((b) => (
              <motion.div key={b.id} className="badge-card glass-card locked" variants={item}>
                <span className="badge-icon-xl locked-icon">{b.icon}</span>
                <h4>{b.name}</h4>
                <p>{b.description}</p>
                <div className="badge-meta">
                  <span className={`rarity-tag ${b.rarity}`}>{b.rarity}</span>
                </div>
                <div className="lock-overlay">
                  <Lock size={24} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { Gem, ShoppingBag, Star, Flame, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import './Gems.css';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function GemsPage() {
  const { user, refreshUser } = useAuthStore();
  const navigate = useNavigate();
  const [gemsData, setGemsData] = useState({ totalGems: 0, history: [] });
  const [rewards, setRewards] = useState([]);
  const [claims, setClaims] = useState({});
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [gems, rewardsData] = await Promise.all([
          api.getMyGems(),
          api.getRewards(),
        ]);
        setGemsData(gems);
        setRewards(rewardsData.rewards);
        setClaims(rewardsData.claims || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleClaim = async (rewardId) => {
    setClaiming(rewardId);
    try {
      const result = await api.claimReward(rewardId);
      setSuccess(result.reward.name);
      refreshUser();
      const updated = await api.getMyGems();
      setGemsData(updated);
      const [gems, rewardsData] = await Promise.all([
        api.getMyGems(),
        api.getRewards(),
      ]);
      setGemsData(gems);
      setRewards(rewardsData.rewards);
      setClaims(rewardsData.claims || {});
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return <div className="page-loader"><span className="spinner large" /></div>;

  const canAfford = (cost) => (gemsData.totalGems || 0) >= cost;

  return (
    <div className="gems-page container">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back
        </button>
      </motion.div>

      <motion.section className="gems-header glass-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="gems-balance">
          <div className="gem-icon-large">
            <Gem size={48} />
          </div>
          <div className="gem-balance-info">
            <span className="gem-balance-amount">{(gemsData.totalGems || 0).toLocaleString()}</span>
            <span className="gem-balance-label">Your Gems</span>
          </div>
        </div>
        <div className="gems-earn-info">
          <p><Sparkles size={16} /> Earn 5 gems for daily login</p>
          <p><Star size={16} /> Earn 25 gems for every quiz completed</p>
        </div>
      </motion.section>

      {success && (
        <motion.div className="success-toast" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <CheckCircle size={20} /> Claimed {success}!
        </motion.div>
      )}

      <section className="rewards-section">
        <h2 className="section-title"><ShoppingBag size={20} /> Rewards Store</h2>
        <motion.div className="rewards-grid" variants={container} initial="hidden" animate="show">
          {rewards.map((reward) => {
            const weeklyUsed = claims[reward.id] || 0;
            const canClaim = canAfford(reward.cost_gems) && weeklyUsed < reward.max_per_week;
            return (
              <motion.div key={reward.id} className={`reward-card glass-card ${!canClaim ? 'locked' : ''}`} variants={item}>
                <div className="reward-icon">{reward.icon}</div>
                <h3>{reward.name}</h3>
                <p className="reward-desc">{reward.description}</p>
                <div className="reward-meta">
                  <span className={`reward-cost ${canAfford(reward.cost_gems) ? 'affordable' : ''}`}>
                    <Gem size={14} /> {reward.cost_gems} gems
                  </span>
                  <span className="reward-limit">
                    {reward.max_per_week - weeklyUsed}/{reward.max_per_week} this week
                  </span>
                </div>
                <button
                  className="claim-btn"
                  disabled={!canClaim || claiming === reward.id}
                  onClick={() => handleClaim(reward.id)}
                >
                  {claiming === reward.id ? (
                    <span className="spinner" />
                  ) : canClaim ? (
                    'Claim Reward'
                  ) : !canAfford(reward.cost_gems) ? (
                    'Need More Gems'
                  ) : (
                    'Weekly Limit Reached'
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="history-section">
        <h2 className="section-title"><Flame size={20} /> Recent Activity</h2>
        <div className="history-list glass-card">
          {gemsData.history?.length > 0 ? (
            gemsData.history.slice(0, 10).map((entry) => (
              <div key={entry.id} className="history-item">
                <div className="history-info">
                  <span className="history-action">{entry.action_type.replace(/_/g, ' ')}</span>
                  <span className="history-date">{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
                <span className={`history-amount ${entry.amount > 0 ? 'positive' : 'negative'}`}>
                  {entry.amount > 0 ? '+' : ''}{entry.amount}
                </span>
              </div>
            ))
          ) : (
            <p className="empty-history">No gem activity yet. Complete quizzes to earn gems!</p>
          )}
        </div>
      </section>
    </div>
  );
}
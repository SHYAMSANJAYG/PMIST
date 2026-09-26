import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Gem, Gift, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import './RewardsPage.css';

export default function RewardsPage() {
  const { user, setUser } = useAuthStore();
  const [rewards, setRewards] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const res = await api.getRewards();
      setRewards(res.rewards);
      setUserRewards(res.userRewards);
      setLoading(false);
    } catch (err) {
      setError('Failed to load rewards');
      setLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    try {
      const res = await api.redeemReward(reward.id);
      if (res.success) {
        setUserRewards([...userRewards, reward.id]);
        setUser({ ...user, gems: res.gemsRemaining });
        alert(`Successfully redeemed ${reward.name}!`);
      }
    } catch (err) {
      alert(err.message || 'Failed to redeem reward');
    }
  };

  if (loading) return <div className="loading-state"><RefreshCw className="spinner" size={32} /></div>;

  return (
    <div className="rewards-page">
      <div className="rewards-header">
        <h1>Rewards Store</h1>
        <div className="gems-balance">
          <Gem size={24} className="gem-icon" />
          <span>{user.gems || 0} Gems</span>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}

      <div className="rewards-grid">
        {rewards.map(reward => {
          const isRedeemed = userRewards.includes(reward.id);
          const canAfford = (user.gems || 0) >= reward.cost;

          return (
            <div key={reward.id} className={`reward-card ${isRedeemed ? 'redeemed' : ''}`}>
              <div className="reward-image">
                <img src={reward.image_url} alt={reward.name} />
              </div>
              <div className="reward-info">
                <h3>{reward.name}</h3>
                <p>{reward.description}</p>
                <div className="reward-action">
                  <span className="reward-cost">
                    <Gem size={16} /> {reward.cost}
                  </span>
                  <button 
                    onClick={() => handleRedeem(reward)} 
                    disabled={isRedeemed || !canAfford}
                    className={`btn ${isRedeemed ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {isRedeemed ? 'Redeemed' : canAfford ? 'Redeem' : 'Not enough Gems'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Router } from 'express';
import { queryAll, queryOne, runQuery } from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

const GEM_REWARDS = {
  login: 5,
  quiz_complete: 25,
  daily_reward: 10,
  streak_reward: (streak) => Math.min(streak * 5, 100),
};

router.get('/my-gems', authenticateToken, (req, res) => {
  try {
    const user = queryOne('SELECT total_gems FROM users WHERE id = ?', [req.user.id]);
    const history = queryAll(
      'SELECT * FROM gems WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ totalGems: user?.total_gems || 0, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rewards', authenticateToken, (req, res) => {
  try {
    const rewards = queryAll('SELECT * FROM rewards WHERE is_active = 1 ORDER BY cost_gems ASC');
    const userRewards = queryAll(
      'SELECT reward_id, COUNT(*) as count FROM user_rewards WHERE user_id = ? AND claimed_at > datetime("now", "-7 days") GROUP BY reward_id',
      [req.user.id]
    );
    const rewardCounts = {};
    userRewards.forEach((r) => (rewardCounts[r.reward_id] = r.count));
    res.json({ rewards, claims: rewardCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/claim-reward', authenticateToken, (req, res) => {
  try {
    const { rewardId } = req.body;
    if (!rewardId) return res.status(400).json({ error: 'rewardId required' });

    const reward = queryOne('SELECT * FROM rewards WHERE id = ?', [rewardId]);
    if (!reward) return res.status(404).json({ error: 'Reward not found' });

    const user = queryOne('SELECT total_gems FROM users WHERE id = ?', [req.user.id]);
    if (user.total_gems < reward.cost_gems) {
      return res.status(400).json({ error: 'Insufficient gems' });
    }

    const weekClaimsCount = queryOne(
      'SELECT COUNT(*) as count FROM user_rewards WHERE user_id = ? AND reward_id = ? AND claimed_at > datetime("now", "-7 days")',
      [req.user.id, rewardId]
    );

    if (weekClaimsCount.count >= (reward.max_per_week || 3)) {
      return res.status(400).json({ error: 'Weekly limit reached for this reward' });
    }

    runQuery('UPDATE users SET total_gems = total_gems - ? WHERE id = ?', [
      reward.cost_gems,
      req.user.id,
    ]);

    runQuery('INSERT INTO user_rewards (user_id, reward_id, quantity) VALUES (?, ?, 1)', [
      req.user.id,
      rewardId,
    ]);

    runQuery('INSERT INTO gems (user_id, amount, action_type, related_id) VALUES (?, ?, ?, ?)', [
      req.user.id,
      -reward.cost_gems,
      'purchase',
      rewardId,
    ]);

    const updatedUser = queryOne('SELECT total_gems FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, newGemsTotal: updatedUser.total_gems, reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/add-gems', authenticateToken, (req, res) => {
  try {
    const { actionType, amount } = req.body;
    if (!actionType || !amount) {
      return res.status(400).json({ error: 'actionType and amount required' });
    }

    runQuery('UPDATE users SET total_gems = total_gems + ? WHERE id = ?', [amount, req.user.id]);

    runQuery('INSERT INTO gems (user_id, amount, action_type) VALUES (?, ?, ?)', [
      req.user.id,
      amount,
      actionType,
    ]);

    const user = queryOne('SELECT total_gems FROM users WHERE id = ?', [req.user.id]);
    res.json({ totalGems: user.total_gems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

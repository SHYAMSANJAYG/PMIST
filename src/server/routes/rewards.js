import { Router } from 'express';
import { queryAll, queryOne, runQuery } from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/rewards
router.get('/', authenticateToken, (req, res) => {
  try {
    const rewards = queryAll('SELECT * FROM rewards WHERE is_active = 1');
    const userRewards = queryAll('SELECT reward_id FROM user_rewards WHERE user_id = ?', [req.user.id]);
    
    res.json({
      rewards,
      userRewards: userRewards.map(ur => ur.reward_id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rewards/redeem
router.post('/redeem', authenticateToken, (req, res) => {
  try {
    const { rewardId } = req.body;
    
    if (!rewardId) {
      return res.status(400).json({ error: 'rewardId required' });
    }

    const reward = queryOne('SELECT * FROM rewards WHERE id = ? AND is_active = 1', [rewardId]);
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    const user = queryOne('SELECT gems FROM users WHERE id = ?', [req.user.id]);
    const gems = user.gems || 0;

    if (gems < reward.cost) {
      return res.status(400).json({ error: 'Not enough gems' });
    }

    // Check if already redeemed
    const existing = queryOne('SELECT id FROM user_rewards WHERE user_id = ? AND reward_id = ?', [req.user.id, rewardId]);
    if (existing) {
      return res.status(400).json({ error: 'Reward already redeemed' });
    }

    // Deduct gems and add reward
    runQuery('UPDATE users SET gems = gems - ? WHERE id = ?', [reward.cost, req.user.id]);
    runQuery('INSERT INTO user_rewards (user_id, reward_id) VALUES (?, ?)', [req.user.id, rewardId]);

    res.json({ success: true, gemsRemaining: gems - reward.cost, reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

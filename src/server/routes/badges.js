import { Router } from 'express';
import { queryAll, queryOne } from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/badges — list all badge definitions
router.get('/', (req, res) => {
  try {
    const badges = queryAll('SELECT * FROM badges ORDER BY rarity DESC, id');
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/badges/me — get current user's earned badges
router.get('/me', authenticateToken, (req, res) => {
  try {
    const earned = queryAll(
      `SELECT b.*, ub.earned_at FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [req.user.id]
    );

    const all = queryAll('SELECT * FROM badges ORDER BY id');

    res.json({
      earned,
      total: all.length,
      unearned: all.filter(b => !earned.find(e => e.id === b.id))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

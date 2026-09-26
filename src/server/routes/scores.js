import { Router } from 'express';
import { queryAll, queryOne } from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/scores/me — get current user's score info
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalQuizzes = queryOne(
      'SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND completed = 1',
      [req.user.id]
    );

    const recentAttempts = queryAll(
      `SELECT a.*, q.title as quiz_title, t.name as topic_name, t.icon
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       JOIN topics t ON q.topic_id = t.id
       WHERE a.user_id = ? AND a.completed = 1
       ORDER BY a.completed_at DESC LIMIT 10`,
      [req.user.id]
    );

    res.json({
      totalXp: user.total_xp,
      currentLevel: user.current_level,
      currentStreak: user.current_streak,
      longestStreak: user.longest_streak,
      totalQuizzesCompleted: totalQuizzes?.count || 0,
      xpToNextLevel: ((user.current_level) * 300) - user.total_xp,
      recentAttempts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scores/history — get attempt history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const attempts = queryAll(
      `SELECT a.*, q.title as quiz_title, q.difficulty, t.name as topic_name, t.icon, t.color
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       JOIN topics t ON q.topic_id = t.id
       WHERE a.user_id = ? AND a.completed = 1
       ORDER BY a.completed_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

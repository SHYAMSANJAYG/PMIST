import { Router } from 'express';
import { queryAll, queryOne } from '../db/database.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/analytics/class — class-level engagement overview (admin only)
router.get('/class', authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalLearners = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'learner'");
    const activeLearners = queryOne(
      `SELECT COUNT(DISTINCT user_id) as count FROM daily_activity 
       WHERE activity_date >= date('now', '-7 days')`
    );
    const totalAttempts = queryOne('SELECT COUNT(*) as count FROM attempts WHERE completed = 1');
    const avgScore = queryOne('SELECT AVG(CAST(score AS FLOAT) / NULLIF(max_score, 0) * 100) as avg FROM attempts WHERE completed = 1');

    // Participation vs Achievement
    const learnerStats = queryAll(`
      SELECT u.id, u.display_name, u.username, u.total_xp, u.current_level,
        (SELECT COUNT(*) FROM attempts WHERE user_id = u.id AND completed = 1) as total_quizzes,
        (SELECT AVG(CAST(score AS FLOAT) / NULLIF(max_score, 0) * 100) FROM attempts WHERE user_id = u.id AND completed = 1) as avg_score,
        (SELECT COUNT(DISTINCT activity_date) FROM daily_activity WHERE user_id = u.id) as active_days
      FROM users u WHERE u.role = 'learner'
      ORDER BY u.total_xp DESC
    `);

    // Daily activity trend (last 14 days)
    const dailyTrend = queryAll(`
      SELECT activity_date,
        COUNT(DISTINCT user_id) as active_users,
        SUM(quizzes_completed) as total_quizzes,
        SUM(xp_earned) as total_xp
      FROM daily_activity
      WHERE activity_date >= date('now', '-14 days')
      GROUP BY activity_date
      ORDER BY activity_date
    `);

    // Topic popularity
    const topicStats = queryAll(`
      SELECT t.name, t.icon, t.color,
        COUNT(a.id) as attempt_count,
        AVG(CAST(a.score AS FLOAT) / NULLIF(a.max_score, 0) * 100) as avg_score
      FROM topics t
      LEFT JOIN quizzes q ON q.topic_id = t.id
      LEFT JOIN attempts a ON a.quiz_id = q.id AND a.completed = 1
      GROUP BY t.id
      ORDER BY attempt_count DESC
    `);

    res.json({
      overview: {
        totalLearners: totalLearners?.count || 0,
        activeLearners7d: activeLearners?.count || 0,
        totalAttempts: totalAttempts?.count || 0,
        avgScore: Math.round(avgScore?.avg || 0)
      },
      learnerStats,
      dailyTrend,
      topicStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/user/:userId — individual learner analytics (admin only)
router.get('/user/:userId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.params.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const topicStats = queryAll(
      `SELECT lts.*, t.name as topic_name, t.icon, t.color
       FROM learner_topic_stats lts
       JOIN topics t ON lts.topic_id = t.id
       WHERE lts.user_id = ?`,
      [req.params.userId]
    );

    const recentAttempts = queryAll(
      `SELECT a.*, q.title, q.difficulty, t.name as topic_name
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       JOIN topics t ON q.topic_id = t.id
       WHERE a.user_id = ? AND a.completed = 1
       ORDER BY a.completed_at DESC LIMIT 20`,
      [req.params.userId]
    );

    const activityHistory = queryAll(
      `SELECT * FROM daily_activity WHERE user_id = ? ORDER BY activity_date DESC LIMIT 30`,
      [req.params.userId]
    );

    res.json({ user, topicStats, recentAttempts, activityHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/participation — participation vs achievement (admin only)
router.get('/participation', authenticateToken, requireAdmin, (req, res) => {
  try {
    const data = queryAll(`
      SELECT u.id, u.display_name, u.username,
        (SELECT COUNT(*) FROM attempts WHERE user_id = u.id AND completed = 1) as participation_score,
        (SELECT AVG(CAST(score AS FLOAT) / NULLIF(max_score, 0) * 100) FROM attempts WHERE user_id = u.id AND completed = 1) as achievement_score,
        u.total_xp, u.current_level, u.current_streak
      FROM users u WHERE u.role = 'learner'
      ORDER BY u.total_xp DESC
    `);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

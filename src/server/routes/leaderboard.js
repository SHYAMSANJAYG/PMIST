import { Router } from 'express';
import { queryAll } from '../db/database.js';

const router = Router();

// GET /api/leaderboard — global leaderboard
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const leaderboard = queryAll(
      `SELECT u.id, u.username, u.display_name, u.avatar_seed, u.total_xp, u.current_level, u.current_streak,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count,
        (SELECT COUNT(*) FROM attempts WHERE user_id = u.id AND completed = 1) as quizzes_completed
       FROM users u
       WHERE u.role = 'learner'
       ORDER BY u.total_xp DESC
       LIMIT ?`,
      [limit]
    );

    // Add rank
    const ranked = leaderboard.map((u, i) => ({ ...u, rank: i + 1 }));

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaderboard/topic/:topicId — topic-specific leaderboard
router.get('/topic/:topicId', (req, res) => {
  try {
    const leaderboard = queryAll(
      `SELECT u.id, u.username, u.display_name, u.avatar_seed,
        lts.avg_score, lts.total_attempts, lts.mastery_level, lts.current_difficulty
       FROM learner_topic_stats lts
       JOIN users u ON lts.user_id = u.id
       WHERE lts.topic_id = ? AND u.role = 'learner'
       ORDER BY lts.avg_score DESC
       LIMIT 20`,
      [req.params.topicId]
    );

    const ranked = leaderboard.map((u, i) => ({ ...u, rank: i + 1 }));
    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

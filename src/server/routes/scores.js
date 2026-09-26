import { Router } from 'express';
import { queryAll, queryOne } from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/scoring/my-scores — get current user's score info
router.get('/my-scores', authenticateToken, (req, res) => {
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

// GET /api/scores/attempt/:attemptId/review — get full question-level review for an attempt
router.get('/attempt/:attemptId/review', authenticateToken, (req, res) => {
  try {
    const { attemptId } = req.params;

    // Verify the attempt belongs to the requesting user
    const attempt = queryOne(
      `SELECT a.*, q.title as quiz_title, q.description as quiz_description, q.difficulty,
              t.name as topic_name, t.icon, t.color
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       JOIN topics t ON q.topic_id = t.id
       WHERE a.id = ? AND a.user_id = ?`,
      [attemptId, req.user.id]
    );

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Get all responses with their questions (correct answers + explanations)
    const responses = queryAll(
      `SELECT r.user_answer, r.is_correct, r.time_spent_seconds,
              q.id as question_id, q.question_text, q.question_type,
              q.option_a, q.option_b, q.option_c, q.option_d,
              q.correct_answer, q.explanation, q.points, q.difficulty as question_difficulty
       FROM responses r
       JOIN questions q ON r.question_id = q.id
       WHERE r.attempt_id = ?
       ORDER BY q.order_index, q.id`,
      [attemptId]
    );

    res.json({
      attempt: {
        id: attempt.id,
        quizTitle: attempt.quiz_title,
        quizDescription: attempt.quiz_description,
        difficulty: attempt.difficulty,
        topicName: attempt.topic_name,
        topicIcon: attempt.icon,
        topicColor: attempt.color,
        score: attempt.score,
        maxScore: attempt.max_score,
        xpEarned: attempt.xp_earned,
        timeTaken: attempt.time_taken_seconds,
        completedAt: attempt.completed_at,
      },
      questions: responses.map((r, idx) => ({
        number: idx + 1,
        questionId: r.question_id,
        questionText: r.question_text,
        questionType: r.question_type,
        options: {
          A: r.option_a,
          B: r.option_b,
          C: r.option_c,
          D: r.option_d,
        },
        userAnswer: r.user_answer,
        correctAnswer: r.correct_answer,
        isCorrect: !!r.is_correct,
        explanation: r.explanation,
        points: r.points,
        difficulty: r.question_difficulty,
      })),
      summary: {
        totalQuestions: responses.length,
        correctCount: responses.filter(r => r.is_correct).length,
        incorrectCount: responses.filter(r => !r.is_correct).length,
        percentage: attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scoring/activity-calendar — get activity days for streak calendar
router.get('/activity-calendar', authenticateToken, (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const y = parseInt(year) || now.getFullYear();
    const m = parseInt(month) || (now.getMonth() + 1);

    // Build date range for the requested month
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = m === 12
      ? `${y + 1}-01-01`
      : `${y}-${String(m + 1).padStart(2, '0')}-01`;

    const activities = queryAll(
      `SELECT activity_date, quizzes_completed, xp_earned
       FROM daily_activity
       WHERE user_id = ? AND activity_date >= ? AND activity_date < ?
       ORDER BY activity_date`,
      [req.user.id, startDate, endDate]
    );

    const user = queryOne('SELECT current_streak, longest_streak, last_active_date FROM users WHERE id = ?', [req.user.id]);

    res.json({
      year: y,
      month: m,
      currentStreak: user?.current_streak || 0,
      longestStreak: user?.longest_streak || 0,
      lastActiveDate: user?.last_active_date || null,
      activeDays: activities.map(a => ({
        date: a.activity_date,
        quizzes: a.quizzes_completed,
        xp: a.xp_earned,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;


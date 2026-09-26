import { Router } from 'express';
import { queryAll, queryOne, runQuery } from '../db/database.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getAdaptiveDifficulty } from '../engines/adaptiveEngine.js';
import { calculateScore } from '../engines/scoringEngine.js';
import { checkAndAwardBadges } from '../engines/badgeEngine.js';
import { updateStreak } from '../engines/streakEngine.js';

const router = Router();

// GET /api/quizzes/topics — list all topics
router.get('/topics', (req, res) => {
  try {
    const topics = queryAll(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM quizzes WHERE topic_id = t.id AND is_active = 1) as quiz_count
      FROM topics t ORDER BY t.id
    `);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quiz/adaptive/:topicId — get adaptive quiz for user
router.get('/adaptive/:topicId', authenticateToken, (req, res) => {
  try {
    const { topicId } = req.params;
    if (!topicId) {
      return res.status(400).json({ error: 'topicId required' });
    }

    const difficulty = getAdaptiveDifficulty(req.user.id, parseInt(topicId));

    // Find a quiz at or near the recommended difficulty
    let quiz = queryOne(
      `SELECT * FROM quizzes WHERE topic_id = ? AND difficulty = ? AND is_active = 1 
       ORDER BY RANDOM() LIMIT 1`,
      [topicId, difficulty]
    );

    // Fallback: find closest difficulty
    if (!quiz) {
      quiz = queryOne(
        `SELECT * FROM quizzes WHERE topic_id = ? AND is_active = 1 
         ORDER BY ABS(difficulty - ?) LIMIT 1`,
        [topicId, difficulty]
      );
    }

    if (!quiz) {
      return res.status(404).json({ error: 'No quizzes available for this topic' });
    }

    // Get questions (randomized order)
    const questions = queryAll(
      `SELECT id, question_text, question_type, option_a, option_b, option_c, option_d, points, difficulty
       FROM questions WHERE quiz_id = ? ORDER BY RANDOM()`,
      [quiz.id]
    );

    res.json({
      quiz: { ...quiz, recommendedDifficulty: difficulty },
      questions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quizzes/:id — get specific quiz with questions
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const quiz = queryOne('SELECT * FROM quizzes WHERE id = ?', [req.params.id]);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = queryAll(
      `SELECT id, question_text, question_type, option_a, option_b, option_c, option_d, points, difficulty
       FROM questions WHERE quiz_id = ? ORDER BY RANDOM()`,
      [quiz.id]
    );

    const topic = queryOne('SELECT * FROM topics WHERE id = ?', [quiz.topic_id]);

    res.json({ quiz, questions, topic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quizzes/submit — submit quiz attempt
router.post('/submit', authenticateToken, (req, res) => {
  try {
    const { quizId, responses, timeTaken } = req.body;
    const userId = req.user.id;

    if (!quizId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'quizId and responses[] required' });
    }

    const quiz = queryOne('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Grade responses
    let correctCount = 0;
    let totalPoints = 0;
    let maxPoints = 0;
    const gradedResponses = [];

    for (const resp of responses) {
      const question = queryOne('SELECT * FROM questions WHERE id = ?', [resp.questionId]);
      if (!question) continue;

      const isCorrect = resp.answer === question.correct_answer;
      if (isCorrect) {
        correctCount++;
        totalPoints += question.points;
      }
      maxPoints += question.points;

      gradedResponses.push({
        questionId: resp.questionId,
        userAnswer: resp.answer,
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0
      });
    }

    // Calculate XP with anti-abuse scoring
    const scoreResult = calculateScore(userId, quizId, totalPoints, maxPoints, quiz.xp_reward);

    // Create attempt record
    const difficultyBefore = quiz.difficulty;
    const attemptResult = runQuery(
      `INSERT INTO attempts (user_id, quiz_id, score, max_score, xp_earned, time_taken_seconds, difficulty_at_start, difficulty_at_end, completed, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
      [userId, quizId, totalPoints, maxPoints, scoreResult.xpEarned, timeTaken || 0, difficultyBefore, difficultyBefore]
    );

    // Save individual responses
    for (const gr of gradedResponses) {
      runQuery(
        `INSERT INTO responses (attempt_id, question_id, user_answer, is_correct, time_spent_seconds)
         VALUES (?, ?, ?, ?, 0)`,
        [attemptResult.lastInsertRowid, gr.questionId, gr.userAnswer, gr.isCorrect ? 1 : 0]
      );
    }

    // Update user XP and level
    const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    const newXp = user.total_xp + scoreResult.xpEarned;
    const newLevel = Math.floor(newXp / 300) + 1; // Level up every 300 XP

    runQuery(
      'UPDATE users SET total_xp = ?, current_level = ? WHERE id = ?',
      [newXp, newLevel, userId]
    );

    // Update topic stats
    const performanceRatio = maxPoints > 0 ? (totalPoints / maxPoints) : 0;
    const existingStats = queryOne(
      'SELECT * FROM learner_topic_stats WHERE user_id = ? AND topic_id = ?',
      [userId, quiz.topic_id]
    );

    const newDifficulty = getAdaptiveDifficulty(userId, quiz.topic_id, performanceRatio);

    if (existingStats) {
      const newAvg = ((existingStats.avg_score * existingStats.total_attempts) + (performanceRatio * 100)) / (existingStats.total_attempts + 1);
      const mastery = newAvg >= 90 ? 'master' : newAvg >= 75 ? 'advanced' : newAvg >= 55 ? 'intermediate' : 'beginner';

      runQuery(
        `UPDATE learner_topic_stats SET 
         total_attempts = total_attempts + 1,
         correct_answers = correct_answers + ?,
         total_questions_seen = total_questions_seen + ?,
         avg_score = ?,
         current_difficulty = ?,
         mastery_level = ?,
         last_attempt_date = ?
         WHERE user_id = ? AND topic_id = ?`,
        [correctCount, responses.length, newAvg, newDifficulty, mastery, new Date().toISOString().split('T')[0], userId, quiz.topic_id]
      );
    } else {
      const mastery = performanceRatio >= 0.9 ? 'master' : performanceRatio >= 0.75 ? 'advanced' : performanceRatio >= 0.55 ? 'intermediate' : 'beginner';
      runQuery(
        `INSERT INTO learner_topic_stats (user_id, topic_id, total_attempts, correct_answers, total_questions_seen, avg_score, current_difficulty, mastery_level, last_attempt_date)
         VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)`,
        [userId, quiz.topic_id, correctCount, responses.length, performanceRatio * 100, newDifficulty, mastery, new Date().toISOString().split('T')[0]]
      );
    }

    // Update streak
    const streakInfo = updateStreak(userId);

    // Check badges
    const newBadges = checkAndAwardBadges(userId);

    // Update daily activity
    const today = new Date().toISOString().split('T')[0];
    const existingActivity = queryOne(
      'SELECT * FROM daily_activity WHERE user_id = ? AND activity_date = ?',
      [userId, today]
    );

    if (existingActivity) {
      runQuery(
        `UPDATE daily_activity SET quizzes_completed = quizzes_completed + 1, xp_earned = xp_earned + ?, time_spent_seconds = time_spent_seconds + ?
         WHERE user_id = ? AND activity_date = ?`,
        [scoreResult.xpEarned, timeTaken || 0, userId, today]
      );
    } else {
      runQuery(
        `INSERT INTO daily_activity (user_id, activity_date, quizzes_completed, xp_earned, time_spent_seconds)
         VALUES (?, ?, 1, ?, ?)`,
        [userId, today, scoreResult.xpEarned, timeTaken || 0]
      );
    }

    res.json({
      score: totalPoints,
      maxScore: maxPoints,
      percentage: Math.round(performanceRatio * 100),
      xpEarned: scoreResult.xpEarned,
      xpPenalty: scoreResult.penalty,
      totalXp: newXp,
      level: newLevel,
      streak: streakInfo,
      newDifficulty,
      newBadges,
      responses: gradedResponses
    });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

/**
 * Badge Engine — Condition Evaluator
 * 
 * Checks all badge conditions against current user stats
 * and awards any newly earned badges.
 * 
 * Badge condition types:
 *   - streak_count: Current streak >= value
 *   - perfect_score: Number of 100% quizzes >= value
 *   - topic_mastery: Avg score in any topic >= value (with 5+ attempts)
 *   - multi_topic_master: Number of topics at 'master' level >= value
 *   - level_reached: Current level >= value
 *   - quizzes_completed: Total completed quizzes >= value
 *   - comeback: Improved from <50% to >85% in same topic
 *   - speed_complete: Completed quiz in < value seconds with 80%+
 *   - topics_explored: Number of distinct topics attempted >= value
 */

import { queryAll, queryOne, runQuery } from '../db/database.js';

export function checkAndAwardBadges(userId) {
  const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) return [];

  const allBadges = queryAll('SELECT * FROM badges');
  const earnedBadgeIds = queryAll(
    'SELECT badge_id FROM user_badges WHERE user_id = ?',
    [userId]
  ).map(b => b.badge_id);

  const newBadges = [];

  for (const badge of allBadges) {
    // Skip already earned
    if (earnedBadgeIds.includes(badge.id)) continue;

    let earned = false;

    switch (badge.condition_type) {
      case 'streak_count':
        earned = user.current_streak >= badge.condition_value;
        break;

      case 'perfect_score': {
        const perfectCount = queryOne(
          `SELECT COUNT(*) as count FROM attempts 
           WHERE user_id = ? AND completed = 1 AND score = max_score AND max_score > 0`,
          [userId]
        );
        earned = (perfectCount?.count || 0) >= badge.condition_value;
        break;
      }

      case 'topic_mastery': {
        const topicStats = queryAll(
          'SELECT * FROM learner_topic_stats WHERE user_id = ? AND total_attempts >= 5',
          [userId]
        );
        earned = topicStats.some(s => s.avg_score >= badge.condition_value);
        break;
      }

      case 'multi_topic_master': {
        const masterTopics = queryOne(
          `SELECT COUNT(*) as count FROM learner_topic_stats 
           WHERE user_id = ? AND mastery_level = 'master'`,
          [userId]
        );
        earned = (masterTopics?.count || 0) >= badge.condition_value;
        break;
      }

      case 'level_reached':
        earned = user.current_level >= badge.condition_value;
        break;

      case 'quizzes_completed': {
        const quizCount = queryOne(
          'SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND completed = 1',
          [userId]
        );
        earned = (quizCount?.count || 0) >= badge.condition_value;
        break;
      }

      case 'comeback': {
        const stats = queryAll(
          'SELECT * FROM learner_topic_stats WHERE user_id = ?',
          [userId]
        );
        // Check if any topic went from low to high
        earned = stats.some(s => s.avg_score >= 85 && s.total_attempts >= 3);
        break;
      }

      case 'speed_complete': {
        const fastQuiz = queryOne(
          `SELECT COUNT(*) as count FROM attempts 
           WHERE user_id = ? AND completed = 1 
           AND time_taken_seconds < ? AND time_taken_seconds > 0
           AND CAST(score AS FLOAT) / NULLIF(max_score, 0) >= 0.8`,
          [userId, badge.condition_value]
        );
        earned = (fastQuiz?.count || 0) >= 1;
        break;
      }

      case 'topics_explored': {
        const explored = queryOne(
          'SELECT COUNT(DISTINCT topic_id) as count FROM learner_topic_stats WHERE user_id = ?',
          [userId]
        );
        earned = (explored?.count || 0) >= badge.condition_value;
        break;
      }
    }

    if (earned) {
      runQuery(
        'INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        [userId, badge.id]
      );

      // Award badge XP bonus
      if (badge.xp_bonus > 0) {
        runQuery(
          'UPDATE users SET total_xp = total_xp + ? WHERE id = ?',
          [badge.xp_bonus, userId]
        );
      }

      newBadges.push(badge);
    }
  }

  return newBadges;
}

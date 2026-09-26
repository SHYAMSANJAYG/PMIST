/**
 * Adaptive Engine — Difficulty Adjustment Algorithm
 * 
 * Adjusts quiz difficulty based on learner performance history.
 * This is a rule-based, transparent algorithm (not a black box).
 * 
 * RULES:
 *   performance >= 85% AND fast → Increase difficulty (+1, max 5)
 *   performance >= 70%          → Maintain difficulty
 *   performance >= 50%          → Decrease difficulty (-1, min 1)
 *   performance < 50%           → Decrease difficulty (-2, min 1)
 */

import { queryOne } from '../db/database.js';

/**
 * Get the recommended difficulty for a user in a specific topic.
 * @param {number} userId 
 * @param {number} topicId 
 * @param {number|null} latestPerformance - If provided, uses this as the latest performance ratio (0-1)
 * @returns {number} difficulty level 1-5
 */
export function getAdaptiveDifficulty(userId, topicId, latestPerformance = null) {
  // Get existing stats for this user+topic
  const stats = queryOne(
    'SELECT * FROM learner_topic_stats WHERE user_id = ? AND topic_id = ?',
    [userId, topicId]
  );

  // New user/topic combo — start at difficulty 1
  if (!stats) {
    return 1;
  }

  let currentDifficulty = stats.current_difficulty || 1;

  // If we have a fresh performance ratio, adjust
  if (latestPerformance !== null) {
    if (latestPerformance >= 0.85) {
      // Strong performance → increase difficulty
      currentDifficulty = Math.min(5, currentDifficulty + 1);
    } else if (latestPerformance >= 0.70) {
      // Good performance → maintain
      // No change
    } else if (latestPerformance >= 0.50) {
      // Struggling → decrease
      currentDifficulty = Math.max(1, currentDifficulty - 1);
    } else {
      // Very weak → significant decrease
      currentDifficulty = Math.max(1, currentDifficulty - 2);
    }
  }

  return currentDifficulty;
}

/**
 * Get recommendation text based on performance
 */
export function getRecommendation(performanceRatio, currentDifficulty) {
  if (performanceRatio >= 0.85) {
    return {
      type: 'advance',
      message: 'Excellent! You\'re ready for harder challenges.',
      newDifficulty: Math.min(5, currentDifficulty + 1)
    };
  } else if (performanceRatio >= 0.70) {
    return {
      type: 'maintain',
      message: 'Good work! Keep practicing at this level.',
      newDifficulty: currentDifficulty
    };
  } else if (performanceRatio >= 0.50) {
    return {
      type: 'review',
      message: 'Let\'s review some concepts. Try an easier challenge.',
      newDifficulty: Math.max(1, currentDifficulty - 1)
    };
  } else {
    return {
      type: 'foundational',
      message: 'Let\'s build a stronger foundation. Starting with basics.',
      newDifficulty: Math.max(1, currentDifficulty - 2)
    };
  }
}

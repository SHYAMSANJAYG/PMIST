/**
 * Scoring Engine — XP Calculation with Anti-Abuse Rules
 * 
 * ANTI-ABUSE MECHANISMS:
 *   - Same quiz repeated within 1 hour: XP reduced 75%
 *   - Same quiz repeated within 24 hours: XP reduced 50%
 *   - Max 3 scored attempts per quiz per day
 *   - Base XP scales with performance ratio
 */

import { queryOne, queryAll } from '../db/database.js';

/**
 * Calculate XP earned for a quiz attempt with anti-abuse checks
 * @returns {{ xpEarned: number, penalty: string|null, rawXp: number }}
 */
export function calculateScore(userId, quizId, score, maxScore, baseXpReward) {
  const performanceRatio = maxScore > 0 ? score / maxScore : 0;

  // Base XP = reward scaled by performance
  let rawXp = Math.round(baseXpReward * performanceRatio);

  // Bonus for perfect score
  if (performanceRatio === 1.0) {
    rawXp = Math.round(rawXp * 1.2); // 20% bonus
  }

  // Anti-abuse: Check recent attempts on the same quiz
  const recentAttempts = queryAll(
    `SELECT * FROM attempts 
     WHERE user_id = ? AND quiz_id = ? AND completed = 1
     ORDER BY completed_at DESC LIMIT 10`,
    [userId, quizId]
  );

  let penalty = null;
  let xpMultiplier = 1.0;

  if (recentAttempts.length > 0) {
    const lastAttempt = recentAttempts[0];
    const lastTime = new Date(lastAttempt.completed_at).getTime();
    const now = Date.now();
    const hoursSinceLastAttempt = (now - lastTime) / (1000 * 60 * 60);

    // Check daily cap (max 3 scored attempts per quiz per day)
    const today = new Date().toISOString().split('T')[0];
    const todayAttempts = recentAttempts.filter(a => 
      a.completed_at && a.completed_at.startsWith(today)
    );

    if (todayAttempts.length >= 3) {
      xpMultiplier = 0.1;  // Almost no XP after 3 daily attempts
      penalty = 'Daily limit reached (3 attempts). Minimal XP awarded.';
    } else if (hoursSinceLastAttempt < 1) {
      xpMultiplier = 0.25;  // 75% reduction
      penalty = 'Repeated within 1 hour. XP reduced by 75%.';
    } else if (hoursSinceLastAttempt < 24) {
      xpMultiplier = 0.50;  // 50% reduction
      penalty = 'Repeated within 24 hours. XP reduced by 50%.';
    }
  }

  const xpEarned = Math.max(1, Math.round(rawXp * xpMultiplier));

  return { xpEarned, penalty, rawXp };
}

/**
 * Calculate level from XP
 * Level formula: Level = floor(XP / 300) + 1
 */
export function calculateLevel(totalXp) {
  return Math.floor(totalXp / 300) + 1;
}

/**
 * Get XP needed for next level
 */
export function xpForNextLevel(currentLevel) {
  return currentLevel * 300;
}

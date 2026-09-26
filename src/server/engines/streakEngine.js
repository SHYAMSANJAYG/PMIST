/**
 * Streak Engine — Daily Activity & Streak Tracking
 * 
 * RULES:
 *   - Streak increments when a user completes at least 1 quiz on a new day
 *   - Streak resets if a day is missed
 *   - Longest streak is tracked separately
 */

import { queryOne, runQuery } from '../db/database.js';

/**
 * Update the user's streak based on current activity
 * @returns {{ currentStreak: number, longestStreak: number, streakIncreased: boolean }}
 */
export function updateStreak(userId) {
  const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) return { currentStreak: 0, longestStreak: 0, streakIncreased: false };

  const today = new Date().toISOString().split('T')[0];
  const lastActive = user.last_active_date;

  let newStreak = user.current_streak;
  let streakIncreased = false;

  let gemsEarned = 0;
  if (!lastActive || lastActive === '') {
    // First activity ever
    newStreak = 1;
    streakIncreased = true;
    gemsEarned = 50;
  } else if (lastActive === today) {
    // Already active today — no streak change, UNLESS streak is 0
    if (newStreak === 0) {
      newStreak = 1;
      streakIncreased = true;
      gemsEarned = 50;
    }
  } else {
    // Check if last active was yesterday
    const lastDate = new Date(lastActive);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day — increment streak
      newStreak = user.current_streak + 1;
      streakIncreased = true;
      gemsEarned = 50;
    } else if (diffDays > 1) {
      // Missed days — reset streak
      newStreak = 1;
      streakIncreased = true; // It's a "new" streak
      gemsEarned = 50;
    }
  }

  const longestStreak = Math.max(user.longest_streak, newStreak);
  const newGems = (user.gems || 0) + gemsEarned;

  // Update user
  runQuery(
    `UPDATE users SET current_streak = ?, longest_streak = ?, last_active_date = ?, gems = ? WHERE id = ?`,
    [newStreak, longestStreak, today, newGems, userId]
  );

  return {
    currentStreak: newStreak,
    longestStreak,
    streakIncreased,
    gemsEarned
  };
}

import { queryAll, queryOne, runQuery } from '../db/database.js';

/**
 * Point Decay Engine
 * If user is Top 1 on leaderboard and hasn't been active for >12 hours,
 * deduct 10 XP per hour of inactivity past 12 hours.
 */
export function applyPointDecay() {
  // Check who is top 1
  const usersByXp = queryAll(`SELECT id FROM users WHERE role = 'learner' ORDER BY total_xp DESC LIMIT 1`);
  
  if (usersByXp.length === 0) return;
  const userId = usersByXp[0].id;

  const user = queryOne('SELECT total_xp, last_activity_time FROM users WHERE id = ?', [userId]);
  if (!user || !user.last_activity_time) return;

  const lastActive = new Date(user.last_activity_time + 'Z'); // UTC
  const now = new Date();
  
  const diffHours = (now - lastActive) / (1000 * 60 * 60);

  if (diffHours >= 12) {
    const hoursPastThreshold = Math.floor(diffHours - 12);
    const decayAmount = hoursPastThreshold * 10;
    
    // We should only decay points once per hour. But we only have last_activity_time. 
    // If we just subtract, the next time this runs we might double-subtract unless we update last_activity_time.
    // So if decay happens, we advance last_activity_time by `hoursPastThreshold` hours so we don't deduct again.
    
    if (decayAmount > 0) {
      const newXp = Math.max(0, user.total_xp - decayAmount);
      
      // Advance last_activity_time by hoursPastThreshold hours
      const newActiveTime = new Date(lastActive.getTime() + (hoursPastThreshold * 60 * 60 * 1000));
      const newActiveStr = newActiveTime.toISOString().replace('T', ' ').substring(0, 19);

      runQuery(
        `UPDATE users SET total_xp = ?, last_activity_time = ? WHERE id = ?`,
        [newXp, newActiveStr, userId]
      );
    }
  }
}

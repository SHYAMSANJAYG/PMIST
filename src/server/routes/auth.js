import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, queryAll, runQuery } from '../db/database.js';
import { authenticateToken, JWT_SECRET } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check existing user
    const existing = queryOne('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const avatarSeed = username.toLowerCase();

    const result = runQuery(
      `INSERT INTO users (username, email, password_hash, display_name, role, avatar_seed, last_active_date)
       VALUES (?, ?, ?, ?, 'learner', ?, ?)`,
      [username, email, passwordHash, displayName, avatarSeed, new Date().toISOString().split('T')[0]]
    );

    const token = jwt.sign(
      { id: result.lastInsertRowid, username, role: 'learner' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, username, displayName, role: 'learner' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        totalXp: user.total_xp,
        currentLevel: user.current_level,
        currentStreak: user.current_streak,
        totalGems: user.total_gems || 0,
        avatarSeed: user.avatar_seed
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const badges = queryAll(
      `SELECT b.*, ub.earned_at FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [req.user.id]
    );

    const topicStats = queryAll(
      `SELECT lts.*, t.name as topic_name, t.icon, t.color
       FROM learner_topic_stats lts
       JOIN topics t ON lts.topic_id = t.id
       WHERE lts.user_id = ?`,
      [req.user.id]
    );

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      email: user.email,
      role: user.role,
      totalXp: user.total_xp,
      currentLevel: user.current_level,
      currentStreak: user.current_streak,
      longestStreak: user.longest_streak,
      totalGems: user.total_gems || 0,
      avatarSeed: user.avatar_seed,
      createdAt: user.created_at,
      badges,
      topicStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

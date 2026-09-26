import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb, closeDb } from './db/database.js';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quizzes.js';
import scoreRoutes from './routes/scores.js';
import badgeRoutes from './routes/badges.js';
import leaderboardRoutes from './routes/leaderboard.js';
import analyticsRoutes from './routes/analytics.js';
import gemsRoutes from './routes/gems.js';
import rewardsRoutes from './routes/rewards.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Initialize database before starting
async function startServer() {
  try {
    await getDb();
    console.log('💾 Database connected');

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/quiz', quizRoutes);
    app.use('/api/scoring', scoreRoutes);
    app.use('/api/badges', badgeRoutes);
    app.use('/api/leaderboard', leaderboardRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/gems', gemsRoutes);
    app.use('/api/rewards', rewardsRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Error handling
    app.use((err, req, res, next) => {
      console.error('❌ Error:', err.message);
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
      });
    });

    app.listen(PORT, () => {
      console.log(`\n🚀 Brilliance API running at http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  closeDb();
  process.exit(0);
});

startServer();

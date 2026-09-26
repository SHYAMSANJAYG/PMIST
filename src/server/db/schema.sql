-- ============================================
-- Brilliance: Gamified Learning Platform
-- SQLite Database Schema
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'learner' CHECK(role IN ('learner', 'admin')),
    avatar_seed TEXT DEFAULT '',
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Topics / Categories
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#6C63FF',
    difficulty_range_min INTEGER DEFAULT 1,
    difficulty_range_max INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes / Challenges
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    title TEXT NOT NULL,
    description TEXT,
    difficulty INTEGER DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 5),
    time_limit_seconds INTEGER DEFAULT 60,
    xp_reward INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Questions within quizzes
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'mcq' CHECK(question_type IN ('mcq', 'true_false', 'fill_blank')),
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 5),
    points INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0
);

-- Quiz attempts (every play session)
CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    difficulty_at_start INTEGER,
    difficulty_at_end INTEGER,
    completed BOOLEAN DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Individual question responses
CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL REFERENCES attempts(id),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    user_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Badge definitions
CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT CHECK(category IN ('streak', 'mastery', 'milestone', 'topic', 'special')),
    condition_type TEXT NOT NULL,
    condition_value INTEGER NOT NULL,
    rarity TEXT DEFAULT 'common' CHECK(rarity IN ('common', 'rare', 'epic', 'legendary')),
    xp_bonus INTEGER DEFAULT 0
);

-- User earned badges
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    badge_id INTEGER NOT NULL REFERENCES badges(id),
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- Learner performance per topic (for adaptive engine)
CREATE TABLE IF NOT EXISTS learner_topic_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    total_attempts INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_questions_seen INTEGER DEFAULT 0,
    avg_score REAL DEFAULT 0,
    current_difficulty INTEGER DEFAULT 1,
    mastery_level TEXT DEFAULT 'beginner' CHECK(mastery_level IN ('beginner', 'intermediate', 'advanced', 'master')),
    last_attempt_date TEXT,
    UNIQUE(user_id, topic_id)
);

-- Daily activity log (for streak + analytics)
CREATE TABLE IF NOT EXISTS daily_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    activity_date TEXT NOT NULL,
    quizzes_completed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    UNIQUE(user_id, activity_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_stats_user_topic ON learner_topic_stats(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_id);

# Brilliance — Gamified Learning Engagement Platform
### Complete Project Documentation

> **Project:** URAN 2026 Hackathon · Track: EdTech · Challenge ID: ET-07  
> **Version:** 1.0.0 · **Environment:** Local Node.js · **Status:** Demo-ready

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Environment Configuration](#5-environment-configuration)
6. [Database Schema](#6-database-schema)
7. [Backend — Server Architecture](#7-backend--server-architecture)
8. [API Reference](#8-api-reference)
9. [Engine Layer](#9-engine-layer)
10. [Frontend — Client Architecture](#10-frontend--client-architecture)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Scoring & Gamification Rules](#12-scoring--gamification-rules)
13. [Demo Credentials](#13-demo-credentials)
14. [Known Limitations](#14-known-limitations)

---

## 1. Project Overview

**Brilliance** is a full-stack, gamified learning engagement platform that transforms passive learning into active participation. It is inspired by Brilliant.org and designed to serve students, self-learners, and educators.

The platform solves a core problem in digital education: **static leaderboards reward activity but not learning**. Brilliance instead uses an adaptive difficulty engine, mastery-based badge conditions, and an analytics dashboard that explicitly separates "participation" from "achievement."

### Core Features

| Feature | Description |
|---|---|
| **Adaptive Quiz Engine** | Difficulty adjusts after every attempt based on performance, so no learner is always over-challenged or under-challenged |
| **XP & Level System** | Transparent formula — Level = floor(XP / 300) + 1 — so learners always know how close they are to the next level |
| **Anti-Abuse Scoring** | Prevents XP farming through diminishing returns on repeated attempts and daily caps |
| **Badge System** | 15 badges across 5 categories (streak, mastery, milestone, topic, special) with documented, verifiable conditions |
| **Streak Tracking** | Daily activity streaks with calendar visualization; resets on missed days |
| **Real-Time Leaderboard** | Global and topic-specific leaderboards ranked by XP and avg score respectively |
| **Instructor Analytics** | Admin dashboard showing participation frequency vs. achievement scores for every learner |
| **Role-Based Access** | `learner` and `admin` roles enforced at both API and UI level |

---

## 2. Technology Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| React | ^19.2.8 | UI framework (component-based SPA) |
| Vite | ^8.3.0 | Build tool and dev server (HMR) |
| React Router DOM | ^7.18.4 | Client-side routing |
| Framer Motion | ^13.4.4 | Page transitions and celebration animations |
| Recharts | ^3.10.1 | Analytics charts (line, bar, scatter) |
| Zustand | ^5.0.15 | Lightweight global auth state |
| Lucide React | ^1.48.0 | Icon library |
| oxlint | ^1.81.0 | Fast JavaScript linter |

### Backend
| Library | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | ^4.21.0 | HTTP server and router |
| sql.js | ^1.11.0 | SQLite compiled to WASM (no native binaries) |
| bcryptjs | ^2.4.3 | Password hashing (cost factor 10) |
| jsonwebtoken | ^9.0.2 | JWT-based stateless authentication |
| cors | ^2.8.5 | Cross-origin request handling |
| dotenv | ^16.4.5 | Environment variable loading |

---

## 3. Project Structure

```
PMIST/
├── docs/
│   ├── DOCUMENTATION.md      <- This file
│   ├── architecture.md       <- Architecture explanation
│   └── architecture.png      <- System diagram
├── src/
│   ├── server/               <- Node.js + Express API
│   │   ├── index.js          <- Server entry point
│   │   ├── .env.example      <- Environment variable template
│   │   ├── db/
│   │   │   ├── schema.sql    <- Full SQLite schema
│   │   │   ├── database.js   <- DB connection + query helpers
│   │   │   ├── seed.js       <- Demo data seeder (9 users, 125 questions)
│   │   │   └── brilliance.db <- SQLite database file (generated on seed)
│   │   ├── middleware/
│   │   │   └── authMiddleware.js  <- JWT verification + role guards
│   │   ├── routes/
│   │   │   ├── auth.js       <- /api/auth/*
│   │   │   ├── quizzes.js    <- /api/quiz/*
│   │   │   ├── scores.js     <- /api/scoring/*
│   │   │   ├── badges.js     <- /api/badges/*
│   │   │   ├── leaderboard.js <- /api/leaderboard/*
│   │   │   └── analytics.js  <- /api/analytics/* (admin-only)
│   │   └── engines/
│   │       ├── adaptiveEngine.js  <- Difficulty adjustment algorithm
│   │       ├── scoringEngine.js   <- XP calculation + anti-abuse rules
│   │       ├── badgeEngine.js     <- Badge condition evaluator
│   │       └── streakEngine.js    <- Streak + daily activity tracker
│   └── client/               <- React + Vite SPA
│       ├── index.html
│       ├── vite.config.js
│       └── src/
│           ├── App.jsx        <- Root router + route guards
│           ├── main.jsx       <- React DOM entry
│           ├── stores/
│           │   └── authStore.jsx  <- Zustand auth state
│           ├── components/
│           │   ├── Navbar.jsx     <- Top navigation bar
│           │   └── StreakCalendar.jsx <- Monthly activity heatmap
│           ├── pages/
│           │   ├── LoginPage.jsx
│           │   ├── RegisterPage.jsx
│           │   ├── DashboardPage.jsx
│           │   ├── QuizPage.jsx
│           │   ├── LeaderboardPage.jsx
│           │   ├── BadgesPage.jsx
│           │   ├── ProfilePage.jsx
│           │   └── AdminPage.jsx
│           └── lib/           <- Shared utilities / API client
```

---

## 4. Getting Started

### Prerequisites

- **Node.js** version 18 or higher (`node -v` to check)
- **npm** version 9 or higher (`npm -v` to check)

### Step 1 — Install server dependencies

```bash
cd src/server
npm install
```

### Step 2 — Seed the database

This creates the SQLite database and populates it with 5 topics, 25 quizzes, 125 questions, 15 badge definitions, and 9 demo users.

```bash
npm run seed
```

Expected output:
```
Seeding Brilliance database...
Database seeded successfully!
   5 Topics (Logic, Math, Physics, CS, Science)
   25 Quizzes (5 per topic, difficulty 1-5)
   125 Questions (5 per quiz with explanations)
   15 Badge definitions
   9 Users (1 admin + 7 learners + 1 fresh demo)
```

### Step 3 — Install client dependencies

```bash
cd ../client
npm install
```

### Step 4 — Run both servers

Open **two separate terminals**:

**Terminal 1 — API Server:**
```bash
cd src/server
npm run dev
# Starts on http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd src/client
npm run dev
# Starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### Available npm Scripts

**Server (`src/server/`):**
| Script | Command | Description |
|---|---|---|
| `npm start` | `node index.js` | Production start |
| `npm run dev` | `node --watch index.js` | Development (auto-restart on change) |
| `npm run seed` | `node db/seed.js` | Seed demo data into the database |

**Client (`src/client/`):**
| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite` | Start dev server with HMR |
| `npm run build` | `vite build` | Build production bundle |
| `npm run preview` | `vite preview` | Preview production build |
| `npm run lint` | `oxlint` | Lint the codebase |

---

## 5. Environment Configuration

Copy `.env.example` to `.env` in `src/server/` before running:

```bash
cp src/server/.env.example src/server/.env
```

**Available variables:**

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the API server listens on |
| `JWT_SECRET` | `brilliance-hackathon-secret-2026` | Secret key for JWT signing — **change in production** |

> **Security Note:** Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 6. Database Schema

The database is SQLite, managed via `sql.js` (WebAssembly). The schema file is at `src/server/db/schema.sql`.

### Tables

#### `users`
Stores all user accounts.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment primary key |
| `username` | TEXT UNIQUE | Login username |
| `email` | TEXT UNIQUE | User email |
| `password_hash` | TEXT | bcrypt hash (cost 10) |
| `display_name` | TEXT | Public display name |
| `role` | TEXT | `'learner'` or `'admin'` |
| `avatar_seed` | TEXT | Seed string for deterministic avatar generation |
| `total_xp` | INTEGER | Cumulative XP earned |
| `current_level` | INTEGER | Derived from XP: Level = floor(XP/300)+1 |
| `current_streak` | INTEGER | Current consecutive active days |
| `longest_streak` | INTEGER | All-time best streak |
| `last_active_date` | TEXT | ISO date of last completed quiz |
| `created_at` | DATETIME | Account creation time |

#### `topics`
The five content categories.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | Topic name (e.g., "Logic", "Math") |
| `slug` | TEXT UNIQUE | URL-safe identifier |
| `description` | TEXT | Short topic description |
| `icon` | TEXT | Emoji icon |
| `color` | TEXT | Hex color for UI theming |
| `difficulty_range_min/max` | INTEGER | Allowed difficulty range (1-5) |

#### `quizzes`
25 quizzes total (5 per topic, one per difficulty level).

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `topic_id` | INTEGER FK | References `topics.id` |
| `title` | TEXT | Quiz title |
| `description` | TEXT | Short description |
| `difficulty` | INTEGER | 1 (easiest) to 5 (hardest) |
| `time_limit_seconds` | INTEGER | Suggested time limit |
| `xp_reward` | INTEGER | Base XP for completing |
| `is_active` | BOOLEAN | Soft-delete flag |

#### `questions`
125 questions (5 per quiz). Correct answers are **never** sent to the client.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `quiz_id` | INTEGER FK | References `quizzes.id` |
| `question_text` | TEXT | The question |
| `question_type` | TEXT | `mcq`, `true_false`, or `fill_blank` |
| `option_a/b/c/d` | TEXT | Answer choices |
| `correct_answer` | TEXT | Correct option key (e.g., `"A"`) |
| `explanation` | TEXT | Shown after quiz completion |
| `difficulty` | INTEGER | 1-5 |
| `points` | INTEGER | Points awarded if correct |

#### `attempts`
One record per quiz play session.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | References `users.id` |
| `quiz_id` | INTEGER FK | References `quizzes.id` |
| `score` | INTEGER | Points earned |
| `max_score` | INTEGER | Maximum possible points |
| `xp_earned` | INTEGER | XP awarded (after anti-abuse) |
| `time_taken_seconds` | INTEGER | Total time to complete |
| `difficulty_at_start/end` | INTEGER | Difficulty before/after adaptive adjustment |
| `completed` | BOOLEAN | Whether the attempt was fully submitted |
| `started_at / completed_at` | DATETIME | Timestamps |

#### `responses`
One record per question per attempt.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `attempt_id` | INTEGER FK | References `attempts.id` |
| `question_id` | INTEGER FK | References `questions.id` |
| `user_answer` | TEXT | The learner's submitted answer |
| `is_correct` | BOOLEAN | Graded result |
| `time_spent_seconds` | INTEGER | Time on this question |

#### `badges`
15 badge definitions with verifiable condition types.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | Badge name |
| `description` | TEXT | What the badge is for |
| `icon` | TEXT | Emoji icon |
| `category` | TEXT | `streak`, `mastery`, `milestone`, `topic`, `special` |
| `condition_type` | TEXT | Algorithm key (see Badge Engine section) |
| `condition_value` | INTEGER | Threshold value for the condition |
| `rarity` | TEXT | `common`, `rare`, `epic`, `legendary` |
| `xp_bonus` | INTEGER | Bonus XP awarded when earned |

#### `user_badges`
Junction table — tracks which badges each user has earned.

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | References `users.id` |
| `badge_id` | INTEGER FK | References `badges.id` |
| `earned_at` | DATETIME | When the badge was awarded |
| UNIQUE | (user_id, badge_id) | Each badge can only be earned once |

#### `learner_topic_stats`
Per-user, per-topic performance statistics. Used by the Adaptive Engine.

| Column | Type | Description |
|---|---|---|
| `user_id / topic_id` | INTEGER FK | Composite unique key |
| `total_attempts` | INTEGER | Number of quizzes completed in this topic |
| `correct_answers` | INTEGER | Total correct answers across all attempts |
| `total_questions_seen` | INTEGER | Total questions encountered |
| `avg_score` | REAL | Running average score percentage (0-100) |
| `current_difficulty` | INTEGER | Current recommended difficulty (1-5) |
| `mastery_level` | TEXT | `beginner`, `intermediate`, `advanced`, `master` |
| `last_attempt_date` | TEXT | Date of most recent attempt |

#### `daily_activity`
One record per user per calendar day. Used for streaks and analytics.

| Column | Type | Description |
|---|---|---|
| `user_id / activity_date` | INTEGER / TEXT | Composite unique key |
| `quizzes_completed` | INTEGER | Quizzes finished that day |
| `xp_earned` | INTEGER | Total XP earned that day |
| `time_spent_seconds` | INTEGER | Total time spent that day |

### Database Indexes

```sql
idx_attempts_user             ON attempts(user_id)
idx_attempts_quiz             ON attempts(quiz_id)
idx_responses_attempt         ON responses(attempt_id)
idx_user_badges_user          ON user_badges(user_id)
idx_learner_stats_user_topic  ON learner_topic_stats(user_id, topic_id)
idx_daily_activity_user_date  ON daily_activity(user_id, activity_date)
idx_questions_quiz            ON questions(quiz_id)
idx_quizzes_topic             ON quizzes(topic_id)
```

---

## 7. Backend — Server Architecture

### Entry Point — `src/server/index.js`

The server initializes in the following order:

1. Load `.env` via `dotenv`
2. Create an Express app with `cors()` and `express.json()` middleware
3. Attach request-logging middleware (logs method, path, status, duration)
4. Call `getDb()` to initialize the SQLite connection
5. Mount all route modules under `/api/*`
6. Register a global error handler
7. Start listening on `PORT` (default: 3000)
8. Register a `SIGINT` handler for graceful shutdown (closes DB cleanly)

### Request Logging

Every request is logged in this format:

```
GET /api/auth/me 200 12ms
POST /api/quiz/submit 200 45ms
```

### Error Handling

A global Express error handler catches any error propagated via `next(err)` and returns:

```json
{ "error": "Error message here" }
```

with the appropriate HTTP status code.

---

## 8. API Reference

**Base URL:** `http://localhost:3000`

All protected routes require the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

Legend: **Auth required** = needs `Authorization` header. **Admin only** = requires `role: admin`.

---

### Auth Routes — `/api/auth`

#### `POST /api/auth/register`
Creates a new learner account.

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "mypassword",
  "displayName": "New User"
}
```

**Response 201:**
```json
{
  "token": "<JWT>",
  "user": {
    "id": 10,
    "username": "newuser",
    "displayName": "New User",
    "role": "learner"
  }
}
```

**Errors:** `400` (missing fields), `409` (username/email taken)

---

#### `POST /api/auth/login`
Authenticates a user and returns a JWT.

**Request Body:**
```json
{
  "username": "alice",
  "password": "demo123"
}
```

**Response 200:**
```json
{
  "token": "<JWT>",
  "user": {
    "id": 2,
    "username": "alice",
    "displayName": "Alice",
    "role": "learner",
    "totalXp": 1450,
    "currentLevel": 5,
    "currentStreak": 7,
    "avatarSeed": "alice"
  }
}
```

**Errors:** `400` (missing fields), `401` (invalid credentials)

---

#### `GET /api/auth/me` *(Auth required)*
Returns the currently authenticated user's full profile, including badges and topic stats.

**Response 200:**
```json
{
  "id": 2,
  "username": "alice",
  "displayName": "Alice",
  "email": "alice@example.com",
  "role": "learner",
  "totalXp": 1450,
  "currentLevel": 5,
  "currentStreak": 7,
  "longestStreak": 12,
  "avatarSeed": "alice",
  "createdAt": "2026-09-26T10:00:00.000Z",
  "badges": [
    { "id": 1, "name": "First Steps", "icon": "...", "earned_at": "2026-09-20T..." }
  ],
  "topicStats": [
    { "topic_id": 1, "topic_name": "Logic", "avg_score": 78.5, "mastery_level": "advanced" }
  ]
}
```

---

### Quiz Routes — `/api/quiz`

#### `GET /api/quiz/topics` *(Public)*
Returns all active topics with quiz counts.

**Response 200:**
```json
[
  { "id": 1, "name": "Logic", "slug": "logic", "icon": "brain", "color": "#6C63FF", "quiz_count": 5 },
  { "id": 2, "name": "Math", "slug": "math", "icon": "calculator", "color": "#FF6584", "quiz_count": 5 }
]
```

---

#### `GET /api/quiz/adaptive/:topicId` *(Auth required)*
Returns a quiz chosen by the Adaptive Engine at the learner's current difficulty. Questions are returned in random order. **Correct answers are never included in the response.**

**Response 200:**
```json
{
  "quiz": {
    "id": 3,
    "title": "Logic Level 2",
    "difficulty": 2,
    "recommendedDifficulty": 2,
    "xp_reward": 150,
    "time_limit_seconds": 120
  },
  "questions": [
    {
      "id": 11,
      "question_text": "What is modus ponens?",
      "question_type": "mcq",
      "option_a": "If P then Q; P; therefore Q",
      "option_b": "If P then Q; Q; therefore P",
      "option_c": "Not P or Q",
      "option_d": "P and not Q",
      "points": 10,
      "difficulty": 2
    }
  ]
}
```

---

#### `GET /api/quiz/:id` *(Auth required)*
Returns a specific quiz by ID with its questions (without correct answers).

**Response 200:**
```json
{
  "quiz": { "id": 3, "title": "...", "difficulty": 2, "xp_reward": 150 },
  "questions": [ ... ],
  "topic": { "id": 1, "name": "Logic", "color": "#6C63FF" }
}
```

---

#### `POST /api/quiz/submit` *(Auth required)*
Submits a completed quiz attempt. This triggers the full engine pipeline.

**Request Body:**
```json
{
  "quizId": 3,
  "timeTaken": 87,
  "responses": [
    { "questionId": 11, "answer": "A" },
    { "questionId": 12, "answer": "C" }
  ]
}
```

**Response 200:**
```json
{
  "score": 30,
  "maxScore": 50,
  "percentage": 60,
  "xpEarned": 75,
  "xpPenalty": null,
  "totalXp": 1525,
  "level": 6,
  "streak": {
    "currentStreak": 8,
    "longestStreak": 12,
    "streakIncreased": true
  },
  "newDifficulty": 1,
  "newBadges": [],
  "responses": [
    {
      "questionId": 11,
      "userAnswer": "A",
      "isCorrect": true,
      "correctAnswer": "A",
      "explanation": "Modus ponens is a basic rule of inference...",
      "points": 10
    }
  ]
}
```

**Full processing pipeline triggered by this endpoint (in order):**

1. Grade all submitted responses against stored correct answers in the DB
2. Calculate XP via Scoring Engine (with anti-abuse checks)
3. Record the attempt and all individual responses in the DB
4. Update user's `total_xp` and `current_level`
5. Update `learner_topic_stats` (running avg score, mastery level, difficulty)
6. Call Adaptive Engine to compute new recommended difficulty
7. Call Streak Engine to update daily activity log and streak
8. Call Badge Engine to evaluate and award any newly earned badges
9. Update `daily_activity` log
10. Return all results to the client in a single response

---

### Scoring Routes — `/api/scoring`

#### `GET /api/scoring/my-scores` *(Auth required)*
Returns the authenticated user's XP summary and last 10 attempts.

**Response 200:**
```json
{
  "totalXp": 1450,
  "currentLevel": 5,
  "currentStreak": 7,
  "longestStreak": 12,
  "totalQuizzesCompleted": 23,
  "xpToNextLevel": 350,
  "recentAttempts": [
    { "quiz_title": "Logic Level 2", "topic_name": "Logic", "score": 30, "max_score": 50, "xp_earned": 75 }
  ]
}
```

---

#### `GET /api/scoring/history` *(Auth required)*
Returns up to 50 completed attempts for the authenticated user, newest first.

---

#### `GET /api/scoring/attempt/:attemptId/review` *(Auth required)*
Returns a full question-by-question review of a specific attempt, including correct answers and explanations. Only the attempt's owner can access it.

**Response 200:**
```json
{
  "attempt": {
    "id": 42, "quizTitle": "Logic Level 2", "difficulty": 2,
    "score": 30, "maxScore": 50, "xpEarned": 75, "timeTaken": 87
  },
  "questions": [
    {
      "number": 1, "questionText": "What is modus ponens?",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "userAnswer": "A", "correctAnswer": "A", "isCorrect": true,
      "explanation": "Modus ponens is...", "points": 10
    }
  ],
  "summary": { "totalQuestions": 5, "correctCount": 3, "incorrectCount": 2, "percentage": 60 }
}
```

---

#### `GET /api/scoring/activity-calendar` *(Auth required)*
Returns daily activity data for a given month for the streak calendar UI.

**Query params:** `?year=2026&month=9`

**Response 200:**
```json
{
  "year": 2026, "month": 9,
  "currentStreak": 7, "longestStreak": 12, "lastActiveDate": "2026-09-26",
  "activeDays": [
    { "date": "2026-09-20", "quizzes": 2, "xp": 180 },
    { "date": "2026-09-21", "quizzes": 1, "xp": 90 }
  ]
}
```

---

### Badge Routes — `/api/badges`

#### `GET /api/badges` *(Auth required)*
Returns all 15 badge definitions and marks which ones the authenticated user has earned.

---

### Leaderboard Routes — `/api/leaderboard`

#### `GET /api/leaderboard` *(Public)*
Returns up to N learners ranked by total XP.

**Query params:** `?limit=20`

**Response 200:**
```json
[
  {
    "rank": 1, "id": 5, "username": "eve", "display_name": "Eve",
    "total_xp": 3200, "current_level": 11, "current_streak": 14,
    "badge_count": 9, "quizzes_completed": 42
  }
]
```

---

#### `GET /api/leaderboard/topic/:topicId` *(Public)*
Returns top 20 learners for a specific topic, ranked by average score.

---

### Analytics Routes — `/api/analytics` *(Auth required + Admin only)*

#### `GET /api/analytics/class`
Class-level engagement overview for the instructor dashboard.

**Response 200:**
```json
{
  "overview": {
    "totalLearners": 8, "activeLearners7d": 5,
    "totalAttempts": 134, "avgScore": 67
  },
  "learnerStats": [
    {
      "id": 2, "display_name": "Alice", "username": "alice",
      "total_xp": 1450, "current_level": 5,
      "total_quizzes": 23, "avg_score": 72.4, "active_days": 11
    }
  ],
  "dailyTrend": [
    { "activity_date": "2026-09-20", "active_users": 4, "total_quizzes": 9, "total_xp": 720 }
  ],
  "topicStats": [
    { "name": "Logic", "icon": "brain", "attempt_count": 38, "avg_score": 64.2 }
  ]
}
```

---

#### `GET /api/analytics/user/:userId`
Detailed analytics for a single learner (topic stats, recent attempts, activity history).

---

#### `GET /api/analytics/participation`
Returns all learners with `participation_score` (quiz count) and `achievement_score` (avg score %) — the key distinction this platform draws between "active" and "actually learning."

**Response 200:**
```json
[
  {
    "id": 2, "display_name": "Alice", "username": "alice",
    "participation_score": 23,
    "achievement_score": 72.4,
    "total_xp": 1450, "current_level": 5, "current_streak": 7
  }
]
```

---

## 9. Engine Layer

All four engines live in `src/server/engines/`. They are synchronous functions called inside the quiz submit pipeline.

---

### Adaptive Engine (`adaptiveEngine.js`)

**Purpose:** Determine which difficulty quiz to serve a learner next, based on their performance history in that topic.

**Algorithm:**

```
performance_ratio = correct_points / max_points

IF performance_ratio >= 85%  →  difficulty += 1  (max 5)
IF performance_ratio >= 70%  →  difficulty unchanged
IF performance_ratio >= 50%  →  difficulty -= 1  (min 1)
IF performance_ratio <  50%  →  difficulty -= 2  (min 1)
```

- **New user / new topic:** Always starts at difficulty 1.
- **Fallback:** If no quiz exists at the exact target difficulty, the system finds the closest quiz using `ORDER BY ABS(difficulty - ?) LIMIT 1`.

**Exported functions:**

| Function | Arguments | Returns |
|---|---|---|
| `getAdaptiveDifficulty(userId, topicId, latestPerformance?)` | user ID, topic ID, optional ratio (0-1) | `number` (1-5) |
| `getRecommendation(performanceRatio, currentDifficulty)` | ratio, current level | `{ type, message, newDifficulty }` |

**Recommendation messages:**

| Type | Condition | Message shown to learner |
|---|---|---|
| `advance` | >= 85% | "Excellent! You're ready for harder challenges." |
| `maintain` | 70-84% | "Good work! Keep practicing at this level." |
| `review` | 50-69% | "Let's review some concepts. Try an easier challenge." |
| `foundational` | < 50% | "Let's build a stronger foundation. Starting with basics." |

---

### Scoring Engine (`scoringEngine.js`)

**Purpose:** Calculate XP earned for an attempt, applying anti-abuse rules.

**Base XP Formula:**
```
rawXp = quiz.xp_reward x (score / max_score)
```

**Perfect Score Bonus:** If `score == max_score`, multiply rawXp by 1.20 (20% bonus).

**Anti-Abuse Rules (applied in priority order):**

| Condition | XP Multiplier | Message |
|---|---|---|
| >= 3 scored attempts of same quiz today | x0.10 | "Daily limit reached (3 attempts). Minimal XP awarded." |
| Same quiz repeated within 1 hour | x0.25 | "Repeated within 1 hour. XP reduced by 75%." |
| Same quiz repeated within 24 hours | x0.50 | "Repeated within 24 hours. XP reduced by 50%." |
| First or clean attempt | x1.00 | None |

**Minimum XP:** Always at least 1 XP per completed attempt.

**Level Formula:**
```
Level = floor(total_xp / 300) + 1
XP needed for next level = current_level x 300
```

---

### Badge Engine (`badgeEngine.js`)

**Purpose:** Evaluate all unearned badge conditions after every quiz submission and award newly earned badges.

**Condition types:**

| `condition_type` | `condition_value` | Evaluation |
|---|---|---|
| `streak_count` | N | `user.current_streak >= N` |
| `perfect_score` | N | Count of attempts where score == max_score >= N |
| `topic_mastery` | N | Any topic with avg_score >= N AND total_attempts >= 5 |
| `multi_topic_master` | N | Count of topics with mastery_level = 'master' >= N |
| `level_reached` | N | `user.current_level >= N` |
| `quizzes_completed` | N | Total completed attempts >= N |
| `comeback` | — | Any topic where avg_score >= 85 AND total_attempts >= 3 |
| `speed_complete` | N (secs) | At least 1 attempt finished in < N seconds with >= 80% score |
| `topics_explored` | N | Count of distinct topics attempted >= N |

**On award:** Badge XP bonus is automatically added to the user's total XP.  
**Idempotent:** Uses `INSERT OR IGNORE` — a badge can never be awarded twice.

---

### Streak Engine (`streakEngine.js`)

**Purpose:** Track daily learning activity and update the user's current streak.

**Rules:**

| Scenario | Effect |
|---|---|
| First ever activity | `current_streak = 1` |
| Active on same day as `last_active_date` | No change |
| Active exactly 1 day after `last_active_date` | `current_streak += 1` |
| Active 2+ days after `last_active_date` | `current_streak = 1` (reset) |

`longest_streak` never decreases — always kept as `MAX(current_streak, longest_streak)`.

---

## 10. Frontend — Client Architecture

### Routing (`App.jsx`)

Two route guard components wrap all pages:

- **`ProtectedRoute`** — Redirects unauthenticated users to `/login`. Accepts `adminOnly` prop that redirects non-admins to `/`.
- **`GuestRoute`** — Redirects authenticated users away from `/login` and `/register` to `/`.

| Route | Guard | Component |
|---|---|---|
| `/login` | GuestRoute | LoginPage |
| `/register` | GuestRoute | RegisterPage |
| `/` | ProtectedRoute | DashboardPage |
| `/quiz` | ProtectedRoute | QuizPage |
| `/leaderboard` | ProtectedRoute | LeaderboardPage |
| `/badges` | ProtectedRoute | BadgesPage |
| `/profile` | ProtectedRoute | ProfilePage |
| `/admin` | ProtectedRoute (adminOnly) | AdminPage |
| `*` | — | Redirect to `/` |

### State Management (`authStore.jsx`)

Global auth state is managed by Zustand:

| State / Action | Type | Description |
|---|---|---|
| `user` | Object or null | The authenticated user object |
| `loading` | boolean | True while hydrating from localStorage |
| `hydrate()` | Function | Called on app mount — reads JWT from localStorage, validates, sets user |
| `login(token, user)` | Function | Saves token to localStorage and updates state |
| `logout()` | Function | Clears token and resets user to null |

### Pages

| Page | Route | Key Features |
|---|---|---|
| **LoginPage** | `/login` | Username + password form. On success, stores JWT and redirects to dashboard. |
| **RegisterPage** | `/register` | Registration form with display name. Auto-logs in on success. |
| **DashboardPage** | `/` | XP progress bar, current level + streak, topic cards with mastery indicators, recent activity feed. |
| **QuizPage** | `/quiz?topicId=1` | Adaptive quiz fetch → timed question UI → animated results screen with XP gained, difficulty change, badge notifications. |
| **LeaderboardPage** | `/leaderboard` | Global and topic tabs. Current user's row is highlighted. Shows rank, XP, level, streak, badges. |
| **BadgesPage** | `/badges` | Grid of all 15 badges. Earned = full color; locked = grayscale with condition shown. |
| **ProfilePage** | `/profile` | XP history chart, per-topic mastery breakdown, earned badges list, streak calendar. |
| **AdminPage** | `/admin` | Class overview metrics, per-learner table (participation vs achievement), daily trend line chart, topic popularity bar chart. |

### Components

| Component | Description |
|---|---|
| **Navbar** | Top navigation bar showing appropriate links per role. Displays avatar (generated from seed), XP, and level. Logout button. |
| **StreakCalendar** | Monthly calendar heatmap where each active day is highlighted. Fetches from `/api/scoring/activity-calendar`. Shows current and longest streak. |

---

## 11. Authentication & Authorization

### Full Auth Flow

```
1. User submits login form
   POST /api/auth/login  {username, password}
   <- {token, user}

2. Frontend stores JWT in localStorage
   authStore.login(token, user)

3. All subsequent API calls attach the header:
   Authorization: Bearer <token>

4. Server middleware verifies:
   jwt.verify(token, JWT_SECRET)
   -> req.user = { id, username, role }

5. Admin routes additionally check:
   req.user.role === 'admin'

6. On logout:
   authStore.logout()
   localStorage cleared, redirect to /login
```

### JWT Token Details

| Property | Value |
|---|---|
| Algorithm | HS256 |
| Payload | `{ id, username, role }` |
| Expiry | 24 hours |
| Secret | From `JWT_SECRET` env variable |

### Middleware

| Middleware | Behavior |
|---|---|
| `authenticateToken` | `401` if no token; `403` if invalid or expired |
| `requireAdmin` | `403` if `req.user.role !== 'admin'` |

---

## 12. Scoring & Gamification Rules

### XP and Leveling

| Rule | Value |
|---|---|
| Base XP | `xp_reward x (score / max_score)` |
| Perfect score bonus | x1.20 multiplier |
| Repeat within 1 hour | x0.25 multiplier (75% reduction) |
| Repeat within 24 hours | x0.50 multiplier (50% reduction) |
| 3rd+ attempt on same quiz today | x0.10 (effectively minimal) |
| Level formula | `floor(total_xp / 300) + 1` |
| XP gap per level | 300 XP |

### Mastery Level Thresholds

Recalculated after every attempt using the running average score for that topic:

| Avg Score | Mastery |
|---|---|
| >= 90% | Master |
| >= 75% | Advanced |
| >= 55% | Intermediate |
| < 55% | Beginner |

### Streak Rules Summary

| Event | Result |
|---|---|
| Complete a quiz (different day) | Streak +1 |
| Complete multiple quizzes (same day) | No additional streak |
| Miss 1+ days | Streak resets to 1 |
| `longest_streak` | Always increases, never decreases |

---

## 13. Demo Credentials

All demo users share the password: **`demo123`**

| Username | Role | Description |
|---|---|---|
| `admin` | admin | Instructor — full access to analytics dashboard |
| `demo` | learner | Fresh account — no history, starts at difficulty 1 |
| `alice` | learner | Active learner with moderate history |
| `bob` | learner | Active learner |
| `charlie` | learner | Active learner |
| `eve` | learner | Top performer — highest XP in the system |
| `grace` | learner | Active learner |
| `diana` | learner | Struggling learner — lower scores, lower mastery levels |
| `frank` | learner | Inactive user — useful for analytics comparison |

---

## 14. Known Limitations

| Limitation | Impact | Reason / Notes |
|---|---|---|
| Single-server deployment | Not horizontally scalable | SQLite is a single-file database; designed for hackathon demo scope |
| SQLite via WASM (not native) | Higher memory usage vs. native SQLite | Chosen for zero native-dependency setup |
| No WebSocket support | Leaderboard requires manual refresh | REST polling is sufficient for demo |
| Static quiz content | No dynamic question generation | Quiz content is seeded; v1 scope |
| No password reset | Users cannot recover accounts | Auth is demo-only |
| No auth rate limiting | Brute-force theoretically possible | Acceptable for local demo environment |
| JWT in localStorage | XSS risk compared to httpOnly cookies | Production should migrate to secure cookies |
| No HTTPS | HTTP only | Acceptable for local demo |

---

*Documentation written for URAN 2026 Hackathon · Brilliance v1.0.0*

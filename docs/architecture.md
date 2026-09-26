# System Architecture — Brilliance: Gamified Learning Platform

## 1. Architecture Overview

Brilliance is a **gamified learning engagement platform** built as a modern web application with a clear separation between the client-side SPA and a RESTful API backend. The system implements adaptive difficulty, mastery-based progression, transparent scoring, badge/level mechanics, leaderboards, and instructor analytics — all designed to align game mechanics with genuine learning outcomes rather than simple activity accumulation.

**Architecture Style:** Client-Server SPA with RESTful API  
**Deployment Model:** Single-machine (hackathon demo), fully self-contained

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │
│  │  Auth    │ │ Quiz     │ │ Dashboard │ │  Admin    │ │
│  │  Pages   │ │ Engine   │ │ + Profile │ │ Analytics │ │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └─────┬─────┘ │
│       └─────────────┴─────────────┴─────────────┘       │
│                         │ REST API (JSON)                │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                    SERVER (Node.js + Express)            │
│  ┌──────────┐ ┌────────────────┐ ┌────────────────────┐ │
│  │ Auth API │ │ Quiz/Score API │ │ Analytics API      │ │
│  │ (JWT)    │ │ + Leaderboard  │ │ (Instructor View)  │ │
│  └────┬─────┘ └───────┬────────┘ └──────────┬─────────┘ │
│       │               │                     │           │
│  ┌────┴───────────────┴─────────────────────┴─────────┐ │
│  │              ENGINE LAYER                           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐ │ │
│  │  │ Adaptive │ │ Scoring  │ │ Badge  │ │ Streak  │ │ │
│  │  │ Engine   │ │ Engine   │ │ Engine │ │ Engine  │ │ │
│  │  └──────────┘ └──────────┘ └────────┘ └─────────┘ │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────────┐ │
│  │              SQLite Database (sql.js / WASM)       │ │
│  │  users │ topics │ quizzes │ questions │ attempts   │ │
│  │  responses │ badges │ user_badges │ streaks        │ │
│  │  learner_topic_stats │ daily_activity              │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 2. Components

| Component | Responsibility | Technology |
|---|---|---|
| Frontend SPA | User interface — auth, quiz gameplay, dashboard, leaderboard, profile, admin analytics | React 18 + Vite, Framer Motion, Recharts, Lucide Icons |
| Backend API | REST endpoints, business logic, authentication, data validation | Node.js + Express |
| Database | Persistent storage for all platform data | SQLite via sql.js (WASM, no native deps) |
| Adaptive Engine | Adjusts quiz difficulty based on learner performance history | Rule-based algorithm (documented, transparent) |
| Scoring Engine | Calculates XP, applies anti-abuse rules, manages level progression | Rule-based with diminishing returns |
| Badge Engine | Evaluates badge conditions after each attempt, awards earned badges | Condition-matching system |
| Streak Engine | Tracks daily activity, computes streaks, handles streak recovery | Date-based activity log |

## 3. Data Flow

### Learner Quiz Flow
1. Learner selects a topic → Frontend requests adaptive quiz from API
2. Backend queries `learner_topic_stats` for current difficulty → Adaptive Engine selects appropriate quiz
3. Questions are fetched and returned (randomized order)
4. Learner answers questions → Frontend submits all responses to API
5. Scoring Engine calculates points with anti-abuse checks (repeat penalty, daily cap)
6. Adaptive Engine re-evaluates difficulty based on performance ratio
7. Badge Engine checks all badge conditions against updated stats
8. Streak Engine updates daily activity and streak count
9. Leaderboard rankings are recomputed
10. Results (score, XP, badges, new difficulty, recommendations) returned to Frontend
11. Frontend displays animated results with celebration effects for badges

### Admin Analytics Flow
1. Admin views dashboard → Frontend requests analytics from API
2. Backend aggregates data: participation frequency, avg scores per topic, class engagement
3. Returns structured data for charts (participation vs achievement distinction)

## 4. Security / Privacy Considerations

- **Authentication:** JWT-based tokens with bcrypt password hashing (cost factor 10)
- **Authorization:** Role-based middleware (`learner` vs `admin`) protects routes
- **Input Validation:** All API inputs validated before database queries
- **SQL Injection Prevention:** Parameterized queries used throughout (never string concatenation)
- **No Secrets in Repo:** All credentials via `.env` (excluded in `.gitignore`)
- **Anti-Abuse:** Scoring rules prevent point farming (diminishing returns on repeats, daily caps)
- **CORS:** Configured to allow only the frontend origin

## 5. Key Design Decisions

### Why Rule-Based Adaptive Engine (Not ML/AI)?
- **Transparency:** Judges can inspect and understand the exact algorithm
- **Explainability:** Every difficulty change has a documented reason
- **No training data needed:** Works from day one with any content
- **Deterministic:** Same inputs always produce same outputs — testable

### Why SQLite via WASM?
- **Zero setup:** No database server installation required
- **Portable:** Single file, works on any OS
- **Demo-friendly:** `npm install && npm start` — nothing else needed
- **Sufficient scale:** Handles hackathon demo data with sub-ms queries

### Adaptive Algorithm Summary
```
After each quiz attempt:
  performance_ratio = correct_answers / total_questions

  IF ratio >= 85% AND fast:  → Increase difficulty (+1, max 5)
  ELSE IF ratio >= 70%:      → Maintain difficulty (same level)
  ELSE IF ratio >= 50%:      → Decrease difficulty (-1, min 1)
  ELSE (ratio < 50%):        → Decrease difficulty (-2, min 1)
                               → Recommend prerequisites
```

### Anti-Abuse Scoring Rules
- Same quiz repeated within 1 hour: XP reduced 75%
- Same quiz repeated within 24 hours: XP reduced 50%
- Max 3 scored attempts per quiz per day
- Streak only counts with at least 1 NEW quiz completed

## 6. Architecture Diagram

See: `docs/architecture.png`

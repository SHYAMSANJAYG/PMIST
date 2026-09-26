import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle, XCircle, ArrowRight, RotateCcw, Home, Zap, Clock, Target, Star, Trophy, Award, ArrowLeft } from 'lucide-react';
import './Quiz.css';

/**
 * Quiz Page — handles 3 phases:
 * 1. Topic selection (if no topic in URL)
 * 2. Quiz gameplay (answer questions)
 * 3. Results (score, XP, new badges)
 */
export default function QuizPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuthStore();

  // Phase: 'select' | 'playing' | 'results'
  const [phase, setPhase] = useState('select');
  const [topics, setTopics] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Load topics on mount
  useEffect(() => {
    api.getTopics().then(setTopics).catch(console.error);
  }, []);

  // Auto-start if topic in URL
  useEffect(() => {
    const topicId = searchParams.get('topic');
    if (topicId && phase === 'select') {
      startQuiz(parseInt(topicId));
    }
  }, [searchParams]);

  // Timer
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startQuiz = async (topicId) => {
    setLoading(true);
    try {
      const data = await api.getAdaptiveQuiz(topicId);
      setQuiz(data.quiz);
      setQuestions(data.questions);
      setCurrentQ(0);
      setAnswers({});
      setConfidences({});
      setSelectedOption(null);
      setTimer(0);
      setPhase('playing');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [confidences, setConfidences] = useState({});

  const selectAnswer = (questionId, answer, confidence = 'high') => {
    setSelectedOption(answer);
    setAnswers({ ...answers, [questionId]: answer });
    setConfidences({ ...confidences, [questionId]: confidence });
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    clearInterval(timerRef.current);
    setLoading(true);
    try {
      const responses = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
        confidence: confidences[q.id] || 'high',
      }));
      const data = await api.submitQuiz({
        quizId: quiz.id,
        responses,
        timeTaken: timer,
      });
      setResults(data);
      setPhase('results');
      refreshUser();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ======== TOPIC SELECT ========
  if (phase === 'select') {
    return (
      <div className="quiz-page container">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button
            className="back-button"
            onClick={() => navigate('/')}
            style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', padding: '8px 0' }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          
          <h1 className="quiz-page-title">
            <Zap size={24} />
            Start a Quiz Challenge
          </h1>
          <p className="quiz-page-subtitle">Pick a topic and the adaptive engine will find the right difficulty for you.</p>

          <div className="topic-select-grid">
            {topics.map((t) => (
              <motion.button
                key={t.id}
                className="topic-select-card glass-card"
                onClick={() => startQuiz(t.id)}
                disabled={loading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ '--topic-color': t.color }}
              >
                <span className="ts-icon">{t.icon}</span>
                <span className="ts-name">{t.name}</span>
                <span className="ts-count">{t.quiz_count} quizzes</span>
                <div className="ts-glow" style={{ background: t.color }} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ======== QUIZ GAMEPLAY ========
  if (phase === 'playing' && questions.length > 0) {
    const q = questions[currentQ];
    const options = [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d },
    ].filter((o) => o.text);

    const progress = ((currentQ + 1) / questions.length) * 100;
    const hasAnswered = answers[q.id] !== undefined;

    return (
      <div className="quiz-page container">
        {/* Progress bar */}
        <div className="quiz-progress">
          <div className="quiz-progress-bar">
            <motion.div
              className="quiz-progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="quiz-meta">
            <span className="quiz-counter">
              <Target size={14} />
              {currentQ + 1} / {questions.length}
            </span>
            <span className="quiz-difficulty">
              Difficulty: {'⭐'.repeat(quiz.difficulty || 1)}
            </span>
            <span className="quiz-timer">
              <Clock size={14} />
              {formatTime(timer)}
            </span>
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            className="question-card glass-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="question-points">
              <Star size={14} /> {q.points} pts
            </div>
            <h2 className="question-text">{q.question_text}</h2>

            <div className="options-list">
              {options.map((opt) => (
                <motion.button
                  key={opt.key}
                  className={`option-btn ${selectedOption === opt.key ? 'selected' : ''}`}
                  onClick={() => selectAnswer(q.id, opt.key, confidences[q.id] || 'high')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="option-key">{opt.key}</span>
                  <span className="option-text">{opt.text}</span>
                </motion.button>
              ))}
            </div>

            <div className="confidence-selection" style={{ marginTop: '20px', display: hasAnswered ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>How confident are you?</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => selectAnswer(q.id, answers[q.id], 'low')}
                  className={`btn ${confidences[q.id] === 'low' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  Low (50%)
                </button>
                <button 
                  onClick={() => selectAnswer(q.id, answers[q.id], 'high')}
                  className={`btn ${confidences[q.id] === 'high' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  High (100%)
                </button>
              </div>
            </div>

            <div className="question-actions">
              <button
                className="next-btn"
                onClick={nextQuestion}
                disabled={!hasAnswered}
              >
                {currentQ < questions.length - 1 ? (
                  <>Next <ArrowRight size={18} /></>
                ) : (
                  <>Finish Quiz <CheckCircle size={18} /></>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ======== RESULTS ========
  if (phase === 'results' && results) {
    const pct = results.percentage || 0;
    const grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'D';
    const gradeColor = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';

    return (
      <div className="quiz-page container">
        <motion.div className="results-card glass-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="results-header">
            <motion.div
              className="results-grade"
              style={{ borderColor: gradeColor, color: gradeColor }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              {grade}
            </motion.div>
            <h1>Quiz Complete!</h1>
            <p className="results-score">{results.score} / {results.maxScore} ({pct}%)</p>
          </div>

          <div className="results-stats">
            <div className="result-stat">
              <Star size={20} color="#FBBF24" />
              <span className="rs-value">+{results.xpEarned}</span>
              <span className="rs-label">XP Earned</span>
            </div>
            <div className="result-stat">
              <Star size={20} color="#ec4899" />
              <span className="rs-value">+{results.gemsEarned}</span>
              <span className="rs-label">Gems Earned</span>
            </div>
            <div className="result-stat">
              <Trophy size={20} color="#10B981" />
              <span className="rs-value">{results.totalXp}</span>
              <span className="rs-label">Total XP</span>
            </div>
            <div className="result-stat">
              <Zap size={20} color="#8B83FF" />
              <span className="rs-value">Lv.{results.level}</span>
              <span className="rs-label">Level</span>
            </div>
            <div className="result-stat">
              <Target size={20} color="#EC4899" />
              <span className="rs-value">D{results.newDifficulty}</span>
              <span className="rs-label">Next Difficulty</span>
            </div>
          </div>

          {results.ghostRunBonus > 0 && (
            <div className="ghost-run-notice" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '10px', borderRadius: '8px', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>
              👻 Ghost Run Beaten! New best time! (+{results.ghostRunBonus} XP)
            </div>
          )}

          {results.xpPenalty > 0 && (
            <div className="penalty-notice">
              ⚠️ Repeat penalty applied: -{results.xpPenalty} XP (anti-abuse scoring)
            </div>
          )}

          {results.streak && (
            <div className="streak-notice">
              🔥 Streak: {results.streak.current} day{results.streak.current !== 1 ? 's' : ''} 
              {results.streak.isNew && ' — Streak updated!'}
            </div>
          )}

          {results.newBadges?.length > 0 && (
            <motion.div className="new-badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <h3><Award size={18} /> New Badges Earned!</h3>
              <div className="badges-row">
                {results.newBadges.map((b) => (
                  <div key={b.id} className="new-badge-item">
                    <span className="badge-icon-large">{b.icon}</span>
                    <span className="badge-name">{b.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Answer review */}
          <div className="answer-review">
            <h3>Answer Review</h3>
            {results.responses?.map((r, i) => (
              <div key={i} className={`review-item ${r.isCorrect ? 'correct' : 'wrong'}`}>
                <div className="review-status">
                  {r.isCorrect ? <CheckCircle size={18} color="#10B981" /> : <XCircle size={18} color="#EF4444" />}
                </div>
                <div className="review-body">
                  <span className="review-answer">
                    Your answer: <strong>{r.userAnswer}</strong>
                    {!r.isCorrect && <> → Correct: <strong>{r.correctAnswer}</strong></>}
                  </span>
                  <span className="review-confidence" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Confidence: {r.confidence === 'high' ? 'High' : 'Low'}
                  </span>
                  {r.explanation && <span className="review-explain">{r.explanation}</span>}
                </div>
                <span className="review-points">{r.points > 0 ? `+${r.points}` : r.points} pts</span>
              </div>
            ))}
          </div>

          <div className="results-actions">
            <button className="action-btn primary" onClick={() => { setPhase('select'); setResults(null); }}>
              <RotateCcw size={18} /> Play Again
            </button>
            <button className="action-btn secondary" onClick={() => navigate('/')}>
              <Home size={18} /> Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback loader
  return <div className="page-loader"><span className="spinner large" /></div>;
}

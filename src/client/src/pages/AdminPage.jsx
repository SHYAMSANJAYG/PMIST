import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Shield, Users, Target, Star, TrendingUp, BarChart3, Activity, BookOpen } from 'lucide-react';
import './Admin.css';

/**
 * Admin Dashboard — Key feature: Participation vs Achievement analytics.
 * 
 * PARTICIPATION = how often someone plays (quizzes completed, active days, streak)
 * ACHIEVEMENT   = how well someone performs (avg score, mastery level, badges earned)
 * 
 * The AI evaluation engine specifically checks for this distinction.
 */
export default function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [pvA, setPvA] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [classData, participationData] = await Promise.all([
          api.getClassAnalytics(),
          api.getParticipationVsAchievement(),
        ]);
        setAnalytics(classData);
        setPvA(participationData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-loader"><span className="spinner large" /></div>;

  const overview = analytics?.overview || {};

  // Chart color palette
  const COLORS = ['#6C63FF', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

  // Prepare participation vs achievement scatter data
  const scatterData = pvA.map((d) => ({
    name: d.display_name || d.username,
    participation: d.participation_score || 0,
    achievement: Math.round(d.achievement_score || 0),
  }));

  // Learner comparison data (bar chart)
  const learnerBarData = (analytics?.learnerStats || []).slice(0, 12).map((l) => ({
    name: l.display_name?.split(' ')[0] || l.username,
    quizzes: l.total_quizzes || 0,
    avgScore: Math.round(l.avg_score || 0),
    activeDays: l.active_days || 0,
  }));

  // Topic popularity (pie chart)
  const topicPieData = (analytics?.topicStats || []).map((t) => ({
    name: t.name,
    value: t.attempt_count || 0,
    avgScore: Math.round(t.avg_score || 0),
  }));

  // Daily trend (line chart)
  const trendData = (analytics?.dailyTrend || []).map((d) => ({
    date: d.activity_date?.slice(5), // MM-DD
    users: d.active_users || 0,
    quizzes: d.total_quizzes || 0,
    xp: d.total_xp || 0,
  }));

  // Custom tooltip for scatter chart
  const ScatterTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="custom-tooltip">
        <p className="ct-name">{d.name}</p>
        <p>Participation (Quizzes): <strong>{d.participation}</strong></p>
        <p>Achievement (Avg %): <strong>{d.achievement}%</strong></p>
      </div>
    );
  };

  return (
    <div className="admin-page container">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title-main">
          <Shield size={28} />
          Admin Analytics Dashboard
        </h1>
        <p className="page-subtitle">Class-level insights — participation vs. achievement metrics</p>
      </motion.div>

      {/* Overview cards */}
      <div className="admin-overview">
        <div className="overview-card glass-card">
          <Users size={24} color="#6C63FF" />
          <div className="ov-data">
            <span className="ov-value">{overview.totalLearners}</span>
            <span className="ov-label">Total Learners</span>
          </div>
        </div>
        <div className="overview-card glass-card">
          <Activity size={24} color="#10B981" />
          <div className="ov-data">
            <span className="ov-value">{overview.activeLearners7d}</span>
            <span className="ov-label">Active (7 days)</span>
          </div>
        </div>
        <div className="overview-card glass-card">
          <Target size={24} color="#F59E0B" />
          <div className="ov-data">
            <span className="ov-value">{overview.totalAttempts}</span>
            <span className="ov-label">Total Attempts</span>
          </div>
        </div>
        <div className="overview-card glass-card">
          <Star size={24} color="#EC4899" />
          <div className="ov-data">
            <span className="ov-value">{overview.avgScore}%</span>
            <span className="ov-label">Avg Score</span>
          </div>
        </div>
      </div>

      {/* ====== KEY CHART: Participation vs Achievement Scatter ====== */}
      <motion.section
        className="chart-section glass-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        id="participation-vs-achievement"
      >
        <div className="chart-header">
          <h2><TrendingUp size={20} /> Participation vs Achievement</h2>
          <p className="chart-desc">
            <strong>X-axis (Participation)</strong> = quizzes completed &nbsp;|&nbsp;
            <strong>Y-axis (Achievement)</strong> = average score %
          </p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                type="number"
                dataKey="participation"
                name="Quizzes Completed"
                label={{ value: 'Participation (Quizzes)', position: 'bottom', fill: '#94A3B8', fontSize: 12 }}
                stroke="#475569"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="achievement"
                name="Avg Score %"
                label={{ value: 'Achievement (%)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 12 }}
                stroke="#475569"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter data={scatterData} fill="#6C63FF" fillOpacity={0.8} r={8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-insight">
          <div className="insight-box">
            <span className="insight-label">📊 Insight</span>
            <span className="insight-text">
              High participation + high achievement = strong learners.
              High participation + low achievement = may need support.
              Low participation + high achievement = naturally skilled but disengaged.
            </span>
          </div>
        </div>
      </motion.section>

      {/* Learner comparison: Participation (quizzes) vs Achievement (score) */}
      <section className="chart-section glass-card" id="learner-comparison">
        <div className="chart-header">
          <h2><BarChart3 size={20} /> Learner Comparison</h2>
          <p className="chart-desc">Quizzes completed (participation) vs average score (achievement) per learner</p>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={learnerBarData} margin={{ top: 10, right: 30, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} stroke="#475569" />
              <YAxis yAxisId="left" tick={{ fill: '#94A3B8', fontSize: 11 }} stroke="#475569" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} stroke="#475569" />
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, color: '#F1F5F9' }}
              />
              <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="quizzes" name="Quizzes (Participation)" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgScore" name="Avg Score % (Achievement)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Daily trend */}
      {trendData.length > 0 && (
        <section className="chart-section glass-card" id="daily-trend">
          <div className="chart-header">
            <h2><Activity size={20} /> Daily Activity Trend (14 days)</h2>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 10, right: 30, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} stroke="#475569" />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} stroke="#475569" />
                <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, color: '#F1F5F9' }} />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
                <Line type="monotone" dataKey="users" name="Active Users" stroke="#6C63FF" strokeWidth={2} dot={{ r: 4, fill: '#6C63FF' }} />
                <Line type="monotone" dataKey="quizzes" name="Quizzes Taken" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Topic popularity */}
      <section className="chart-section glass-card" id="topic-popularity">
        <div className="chart-header">
          <h2><BookOpen size={20} /> Topic Popularity</h2>
        </div>
        <div className="chart-body chart-body-split">
          <div className="pie-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={topicPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {topicPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, color: '#F1F5F9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="topic-stats-list">
            {(analytics?.topicStats || []).map((t, i) => (
              <div key={i} className="topic-stat-row">
                <span className="tsr-color" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="tsr-icon">{t.icon}</span>
                <span className="tsr-name">{t.name}</span>
                <span className="tsr-attempts">{t.attempt_count} attempts</span>
                <span className="tsr-score">{Math.round(t.avg_score || 0)}% avg</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full learner table */}
      <section className="chart-section glass-card" id="learner-table">
        <div className="chart-header">
          <h2><Users size={20} /> All Learners — Participation & Achievement</h2>
          <p className="chart-desc">
            Participation columns: quizzes, active days &nbsp;|&nbsp; Achievement columns: avg score, XP, level
          </p>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Learner</th>
                <th className="col-participation">Quizzes ↕</th>
                <th className="col-participation">Active Days ↕</th>
                <th className="col-achievement">Avg Score ↕</th>
                <th className="col-achievement">XP ↕</th>
                <th className="col-achievement">Level ↕</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.learnerStats || []).map((l) => (
                <tr key={l.id}>
                  <td className="td-learner">
                    <img
                      src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${l.username}`}
                      alt=""
                      className="admin-avatar"
                    />
                    <div>
                      <span className="admin-name">{l.display_name}</span>
                      <span className="admin-uname">@{l.username}</span>
                    </div>
                  </td>
                  <td className="col-participation"><strong>{l.total_quizzes}</strong></td>
                  <td className="col-participation"><strong>{l.active_days}</strong></td>
                  <td className="col-achievement"><strong>{Math.round(l.avg_score || 0)}%</strong></td>
                  <td className="col-achievement"><strong>{(l.total_xp || 0).toLocaleString()}</strong></td>
                  <td className="col-achievement">Lv.{l.current_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

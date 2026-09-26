import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Flame, ChevronLeft, ChevronRight, Zap, Trophy } from 'lucide-react';
import './StreakCalendar.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StreakCalendar({ currentStreak, onClose }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);
  const panelRef = useRef(null);

  // Fetch calendar data when month changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getActivityCalendar(viewYear, viewMonth)
      .then(data => {
        if (!cancelled) {
          setCalendarData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load calendar:', err);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [viewYear, viewMonth]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Check if click was on the trigger button (parent handles this)
        const trigger = document.getElementById('streak-calendar-trigger');
        if (trigger && trigger.contains(e.target)) return;
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === (now.getMonth() + 1);
    if (isCurrentMonth) return; // Don't go to future months
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Build calendar grid
  const buildCalendarDays = () => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const today = now.toISOString().split('T')[0];

    // Map of active days
    const activeMap = {};
    if (calendarData?.activeDays) {
      calendarData.activeDays.forEach(d => {
        activeMap[d.date] = d;
      });
    }

    const cells = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="cal-day empty" />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const activity = activeMap[dateStr];
      const isToday = dateStr === today;
      const isFuture = new Date(dateStr) > now;
      const isActive = !!activity;

      let className = 'cal-day';
      if (isActive) className += ' active';
      if (isToday) className += ' today';
      if (isFuture) className += ' future';

      cells.push(
        <div
          key={day}
          className={className}
          onMouseEnter={() => isActive ? setHoveredDay({ day, ...activity }) : null}
          onMouseLeave={() => setHoveredDay(null)}
        >
          <span className="cal-day-num">{day}</span>
          {isActive && <span className="cal-day-dot" />}
        </div>
      );
    }

    return cells;
  };

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === (now.getMonth() + 1);
  const totalActiveDays = calendarData?.activeDays?.length || 0;

  return (
    <div className="streak-calendar-panel" ref={panelRef}>
      {/* Header with streak info */}
      <div className="streak-cal-header">
        <div className="streak-cal-fire">
          <Flame size={28} className="streak-fire-icon" />
          <div className="streak-cal-count">
            <span className="streak-number">{calendarData?.currentStreak ?? currentStreak}</span>
            <span className="streak-label">Day Streak</span>
          </div>
        </div>
        <div className="streak-cal-stats">
          <div className="streak-mini-stat">
            <Trophy size={14} />
            <span>Best: {calendarData?.longestStreak || 0}</span>
          </div>
          <div className="streak-mini-stat">
            <Zap size={14} />
            <span>{totalActiveDays} active this month</span>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="streak-cal-nav">
        <button className="cal-nav-btn" onClick={goToPrevMonth}>
          <ChevronLeft size={16} />
        </button>
        <span className="cal-month-label">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </span>
        <button
          className={`cal-nav-btn ${isCurrentMonth ? 'disabled' : ''}`}
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="cal-loading">
          <span className="spinner" />
        </div>
      ) : (
        <>
          <div className="cal-grid">
            {/* Day headers */}
            {DAY_LABELS.map(d => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}
            {/* Day cells */}
            {buildCalendarDays()}
          </div>

          {/* Tooltip on hover */}
          {hoveredDay && (
            <div className="cal-tooltip">
              <span className="cal-tooltip-date">
                {MONTH_NAMES[viewMonth - 1]} {hoveredDay.day}
              </span>
              <span className="cal-tooltip-detail">
                {hoveredDay.quizzes} quiz{hoveredDay.quizzes !== 1 ? 'zes' : ''} · +{hoveredDay.xp} XP
              </span>
            </div>
          )}

          {/* Legend */}
          <div className="cal-legend">
            <span className="cal-legend-item">
              <span className="cal-legend-dot active" /> Active
            </span>
            <span className="cal-legend-item">
              <span className="cal-legend-dot today-ring" /> Today
            </span>
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import QuizPage from './pages/QuizPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BadgesPage from './pages/BadgesPage';
import GemsPage from './pages/GemsPage';
import AdminPage from './pages/AdminPage';
import './App.css';

/**
 * ProtectedRoute — redirects to login if not authenticated.
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner large" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

/**
 * GuestRoute — redirects to dashboard if already logged in.
 */
function GuestRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner large" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-shell" id="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public / guest routes */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* Protected learner routes */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
            <Route path="/gems" element={<ProtectedRoute><GemsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />

            {/* Admin only */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff, Star, Sparkles } from 'lucide-react';
import './Auth.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, error } = useAuthStore();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch {
      // error is set in store
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-effects">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
      </div>

      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <Star size={32} />
            <Sparkles size={16} className="sparkle" />
          </div>
          <h1>Join Brilliance</h1>
          <p>Start your gamified learning adventure</p>
        </div>

        {error && <div className="auth-error" id="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-display">Display Name</label>
              <input id="reg-display" type="text" value={form.displayName} onChange={update('displayName')} placeholder="e.g. Alex Chen" required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <input id="reg-username" type="text" value={form.username} onChange={update('username')} placeholder="e.g. alexc" required autoComplete="username" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <div className="password-input">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="Choose a strong password"
                required
                minLength={4}
                autoComplete="new-password"
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading} id="register-submit">
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login" id="goto-login">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

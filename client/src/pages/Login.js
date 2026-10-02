import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, ArrowLeft, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Google Icon ──────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <path fill="#fff" d="M15.68 8.18c0-.57-.05-1.12-.14-1.64H8v3.1h4.31a3.68 3.68 0 01-1.6 2.41v2h2.58c1.51-1.39 2.39-3.44 2.39-5.87z"/>
    <path fill="#d4d4d4" d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.58-2a4.77 4.77 0 01-2.71.75c-2.08 0-3.84-1.4-4.47-3.29H.89v2.06A8 8 0 008 16z"/>
    <path fill="#888" d="M3.53 9.52A4.83 4.83 0 013.27 8c0-.53.09-1.04.26-1.52V4.42H.89A8 8 0 000 8c0 1.29.31 2.52.89 3.58l2.64-2.06z"/>
    <path fill="#ccc" d="M8 3.19c1.17 0 2.22.4 3.05 1.19l2.28-2.28A8 8 0 00.89 4.42L3.53 6.48C4.16 4.59 5.92 3.19 8 3.19z"/>
  </svg>
);

/* ── Mono Background ──────────────────────────────────────── */
const MonoBg = () => (
  <div className="mono-bg">
    <div className="mono-bg-grid" />
    <div className="mono-bg-noise" />
    <div className="mono-bg-vignette" />
  </div>
);

/* ── Main Component ───────────────────────────────────────── */
const Login = () => {
  const { login, signup, googleSignIn, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (tab === 'signin') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) return setError('Display name is required');
        await signup(form.email, form.password, form.name);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await googleSignIn();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="login-wrap" style={{ position: 'relative' }}>
      <MonoBg />

      <Link to="/" className="login-back-btn">
        <ArrowLeft size={12} /> Back
      </Link>

      <div className="login-panel">
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo-wrap">
            <div className="login-logo-icon">
              <Terminal size={20} color="#0a0a0a" />
            </div>
          </div>

          <h1 className="login-heading">CodeSphere</h1>
          <p className="login-subheading">
            {tab === 'signin' ? '// sign in to continue' : '// create your account'}
          </p>

          {/* Tabs */}
          <div className="login-tabs">
            <button className={`login-tab${tab === 'signin' ? ' active' : ''}`} onClick={() => { setTab('signin'); setError(''); }}>Sign In</button>
            <button className={`login-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>Sign Up</button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="login-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {tab === 'signup' && (
                <motion.div
                  key="name"
                  className="form-group"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    required={tab === 'signup'}
                    value={form.name}
                    onChange={set('name')}
                    className="form-input"
                    placeholder="Jane Smith"
                    autoComplete="name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                className="form-input"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={set('password')}
                className="form-input"
                placeholder="••••••••"
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: '0.75rem', bottom: '0.75rem',
                  background: 'none', color: '#606060',
                  display: 'flex', alignItems: 'center', transition: 'color 120ms'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#d4d4d4'}
                onMouseLeave={e => e.currentTarget.style.color = '#606060'}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? '...' : tab === 'signin' ? '→ Sign In' : '→ Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span className="login-divider-line" />
            OR
            <span className="login-divider-line" />
          </div>

          {/* Google */}
          <button className="btn-google" onClick={handleGoogle} disabled={loading}>
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Switch */}
          <p className="login-footer-text">
            {tab === 'signin' ? "No account?" : 'Have an account?'}
            <button className="login-switch-btn" onClick={() => { setTab(t => t === 'signin' ? 'signup' : 'signin'); setError(''); }}>
              {tab === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

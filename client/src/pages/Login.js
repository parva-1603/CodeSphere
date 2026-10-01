import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Code2, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="bg-gradient-container">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
      </div>

      <Link to="/" className="login-back">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="login-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div className="landing-logo-icon" style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem' }}>
              <Code2 style={{ color: 'white' }} size={24} />
            </div>
          </div>

          <div className="login-box">
            <div className="login-top-bar"></div>
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h1>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: 0 }}>
                {isLogin ? 'Sign in to your CodeSphere workspace' : 'Get started with CodeSphere today'}
              </p>
            </div>

            {error && (
              <div style={{ marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="login-input-group">
                  <label className="login-label">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="login-input"
                    placeholder="Jane Doe"
                  />
                </div>
              )}
              <div className="login-input-group">
                <label className="login-label">Email address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="login-input"
                  placeholder="name@example.com"
                />
              </div>
              <div className="login-input-group">
                <label className="login-label">Password</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="login-input"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="login-submit"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
              </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#71717a' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                style={{ color: 'white', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '4px', background: 'none' }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', color: '#52525b' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#3f3f46' }}></div>
              <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#3f3f46' }}></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.6rem',
                backgroundColor: 'white',
                color: 'black',
                borderRadius: '0.5rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

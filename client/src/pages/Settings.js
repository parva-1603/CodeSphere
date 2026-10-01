import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, GitBranch, X } from 'lucide-react';

const Settings = () => {
  const { dbUser, logout, getToken } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubData, setGithubData] = useState({ username: '', pat: '' });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleConnectGithub = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/auth/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ githubUsername: githubData.username, githubAccessToken: githubData.pat })
      });
      if (res.ok) {
        setShowGithubModal(false);
        window.location.reload(); // Quick way to refresh dbUser globally
      } else {
        alert("Failed to connect GitHub");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!window.confirm("Are you sure you want to disconnect GitHub?")) return;
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/auth/github', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <Link to="/dashboard" className="icon-btn" style={{ marginRight: '1rem' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="page-header-title">Settings</h1>
      </header>

      <main className="page-content">
        {/* Profile Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Profile</h2>
          <div className="settings-row" style={{ justifyContent: 'flex-start' }}>
            <div className="profile-avatar-lg">
              {dbUser?.photoURL ? (
                <img src={dbUser.photoURL} alt="Avatar" />
              ) : (
                <span>{dbUser?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="profile-info">
              <h3>{dbUser?.displayName || 'User'}</h3>
              <p>{dbUser?.email || 'No email'}</p>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Appearance</h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">Theme Preference</p>
              <p className="settings-desc">Toggle between light and dark mode</p>
            </div>
            <div 
              className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
              onClick={toggleTheme}
            >
              <div className="toggle-switch-thumb">
                {theme === 'dark' ? <Moon size={14} color="white" /> : <Sun size={14} color="white" />}
              </div>
            </div>
          </div>
        </section>

        {/* GitHub Section */}
        <section className="settings-section">
          <h2 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><GitBranch size={24} /> GitHub Integration</h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">{dbUser?.githubUsername ? `Connected as ${dbUser.githubUsername}` : 'Not connected'}</p>
              <p className="settings-desc">Link your GitHub account to pull/push code.</p>
            </div>
            {dbUser?.githubUsername ? (
              <button onClick={handleDisconnectGithub} className="btn-small danger">
                Disconnect
              </button>
            ) : (
              <button onClick={() => setShowGithubModal(true)} className="btn-small">
                Connect
              </button>
            )}
          </div>
        </section>

        {/* Account Section */}
        <section className="settings-section" style={{ borderColor: 'rgba(248, 113, 113, 0.2)' }}>
          <h2 className="settings-section-title danger">Account</h2>
          <div className="settings-row">
            <div>
              <p className="settings-label">Sign Out</p>
              <p className="settings-desc">Log out of this device.</p>
            </div>
            <button onClick={logout} className="btn-small danger">
              Sign Out
            </button>
          </div>
        </section>
      </main>

      {/* GitHub Connect Modal */}
      {showGithubModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="modal-title" style={{ marginBottom: 0 }}>Connect GitHub</h2>
              <button onClick={() => setShowGithubModal(false)} className="icon-btn"><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>
              To pull and push code, you need to provide a GitHub Personal Access Token (classic). 
              Make sure to give it "repo" scope.
            </p>
            <form onSubmit={handleConnectGithub}>
              <div className="modal-form-group">
                <label className="modal-label">GitHub Username</label>
                <input 
                  type="text" 
                  required
                  value={githubData.username}
                  onChange={(e) => setGithubData({...githubData, username: e.target.value})}
                  className="modal-input"
                  placeholder="e.g. octocat"
                />
              </div>
              <div className="modal-form-group">
                <label className="modal-label">Personal Access Token (PAT)</label>
                <input 
                  type="password" 
                  required
                  value={githubData.pat}
                  onChange={(e) => setGithubData({...githubData, pat: e.target.value})}
                  className="modal-input"
                  placeholder="ghp_xxxxxxxxxxxx"
                />
              </div>
              <div className="modal-actions" style={{ marginTop: '2rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowGithubModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-glow"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

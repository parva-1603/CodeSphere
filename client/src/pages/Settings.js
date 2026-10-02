import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, GitBranch, LogOut, User, Shield, X, ExternalLink, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';

/* ── Mono Background ──────────────────────────────────────── */
const MonoBg = () => (
  <div className="mono-bg">
    <div className="mono-bg-grid" />
    <div className="mono-bg-noise" />
    <div className="mono-bg-vignette" />
  </div>
);

/* ── Toggle ───────────────────────────────────────────────── */
const Toggle = ({ on, onToggle }) => (
  <div
    className={`toggle${on ? ' on' : ''}`}
    onClick={onToggle}
    role="switch"
    aria-checked={on}
    tabIndex={0}
    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
  >
    <div className="toggle-track" />
    <div className="toggle-thumb">
      {on ? <Moon size={9} color="#0a0a0a" /> : <Sun size={9} color="#606060" />}
    </div>
  </div>
);

/* ── Section ──────────────────────────────────────────────── */
const Section = ({ icon, label, danger, children }) => (
  <div className={`settings-section${danger ? ' danger' : ''}`}>
    <div className="settings-section-header">
      <span className="settings-section-icon">{icon}</span>
      <h2 className="settings-section-title">{label}</h2>
    </div>
    {children}
  </div>
);

/* ── Row ──────────────────────────────────────────────────── */
const Row = ({ label, desc, action }) => (
  <div className="settings-row">
    <div className="settings-row-info">
      <p className="settings-row-label">{label}</p>
      {desc && <p className="settings-row-desc">{desc}</p>}
    </div>
    {action}
  </div>
);

/* ── Main ─────────────────────────────────────────────────── */
const Settings = () => {
  const { dbUser, logout, getToken } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubData, setGithubData] = useState({ username: '', pat: '' });
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

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
        addToast({ title: 'GitHub connected', type: 'success' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        addToast({ title: 'Error', description: 'Failed to connect GitHub', type: 'error' });
      }
    } catch {
      addToast({ title: 'Error', description: 'Network error', type: 'error' });
    }
  };

  const performDisconnect = async () => {
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/auth/github', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast({ title: 'Disconnected', type: 'success' });
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      addToast({ title: 'Error', description: 'Failed to disconnect', type: 'error' });
    }
  };

  const displayName = dbUser?.displayName || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="settings-layout">
      <MonoBg />

      {/* Header */}
      <header className="settings-header">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div style={{ width: 1, height: 16, background: '#222' }} />
        <h1 className="settings-title">Settings</h1>
      </header>

      {/* Main */}
      <motion.main
        className="settings-main"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Section label */}
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#404040',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #1a1a1a'
        }}>
          // preferences
        </div>

        {/* Profile */}
        <Section icon={<User size={12} />} label="Profile">
          <Row
            label={displayName}
            desc={dbUser?.email || ''}
            action={
              <div className="profile-avatar-lg">
                {dbUser?.photoURL
                  ? <img src={dbUser.photoURL} alt="Avatar" />
                  : <span>{initial}</span>
                }
              </div>
            }
          />
        </Section>

        {/* Appearance */}
        <Section icon={<Sun size={12} />} label="Appearance">
          <Row
            label="Dark Mode"
            desc="Toggle light and dark interface theme."
            action={
              <Toggle on={theme === 'dark'} onToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
            }
          />
        </Section>

        {/* GitHub */}
        <Section icon={<GitBranch size={12} />} label="GitHub Integration">
          <Row
            label={dbUser?.githubUsername ? `@${dbUser.githubUsername}` : 'Not connected'}
            desc="Link your account to pull and push code from rooms."
            action={
              dbUser?.githubUsername ? (
                <button
                  className="github-btn"
                  onClick={() => setShowDisconnectConfirm(true)}
                  style={{ color: '#ff6060', borderColor: 'rgba(255,68,68,0.3)' }}
                >
                  <X size={12} /> Disconnect
                </button>
              ) : (
                <button
                  className="github-btn"
                  onClick={() => setShowGithubModal(true)}
                >
                  <ExternalLink size={12} /> Connect
                </button>
              )
            }
          />
        </Section>

        {/* Danger zone */}
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#404040',
          margin: '2rem 0 1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid #1a1a1a'
        }}>
          // account
        </div>

        <Section icon={<Shield size={12} />} label="Danger Zone" danger>
          <Row
            label="Sign Out"
            desc="Log out of CodeSphere on this device."
            action={
              <button
                className="github-btn"
                onClick={logout}
                style={{ color: '#ff6060', borderColor: 'rgba(255,68,68,0.3)' }}
              >
                <LogOut size={12} /> Sign Out
              </button>
            }
          />
        </Section>
      </motion.main>

      {/* GitHub Connect Modal */}
      <Dialog open={showGithubModal} onOpenChange={setShowGithubModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect GitHub</DialogTitle>
            <DialogDescription>
              Provide a Personal Access Token (classic) with <code style={{ fontFamily: 'Space Mono', fontSize: '0.85em', background: '#1a1a1a', padding: '1px 5px', borderRadius: 2 }}>repo</code> scope.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConnectGithub}>
            <div className="form-group">
              <label className="form-label">GitHub Username</label>
              <input
                type="text"
                required
                value={githubData.username}
                onChange={e => setGithubData(d => ({ ...d, username: e.target.value }))}
                className="form-input"
                placeholder="octocat"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Personal Access Token</label>
              <input
                type="password"
                required
                value={githubData.pat}
                onChange={e => setGithubData(d => ({ ...d, pat: e.target.value }))}
                className="form-input"
                placeholder="ghp_xxxxxxxxxxxx"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowGithubModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Connect</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirm */}
      <ConfirmModal
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={performDisconnect}
        title="Disconnect GitHub?"
        description="Your GitHub account will be unlinked. You can reconnect anytime."
        confirmText="Disconnect"
        isDanger
      />
    </div>
  );
};

export default Settings;

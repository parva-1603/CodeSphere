import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, GitBranch, LogOut, User, Shield, X, ExternalLink, Sparkles, Check, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import NotificationMenu from '../components/ui/NotificationMenu';
import { API_BASE_URL } from '../config/api';

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
  const { dbUser, logout, getToken, updateProfile } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubData, setGithubData] = useState({ username: '', pat: '' });
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const { addToast } = useToast();

  // Profile Edit State
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [photoURLInput, setPhotoURLInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (dbUser) {
      setDisplayNameInput(dbUser.displayName || '');
      setPhotoURLInput(dbUser.photoURL || '');
    }
  }, [dbUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setSuggestions([]);
    setSavingProfile(true);

    try {
      await updateProfile(displayNameInput, photoURLInput);
      addToast({ title: 'Profile Updated', type: 'success' });
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
      if (err.suggestions && err.suggestions.length > 0) {
        setSuggestions(err.suggestions);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSelectSuggestion = (suggestedName) => {
    setDisplayNameInput(suggestedName);
    setSuggestions([]);
    setProfileError('');
  };

  const handlePresetAvatar = (seed) => {
    setPhotoURLInput(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`);
  };

  const handleConnectGithub = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/auth/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ githubUsername: githubData.username, githubAccessToken: githubData.pat })
      });
      if (res.ok) {
        setShowGithubModal(false);
        addToast({ title: 'GitHub connected', type: 'success' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        addToast({ title: 'Error', description: data.error || 'Failed to connect GitHub', type: 'error' });
      }
    } catch (err) {
      addToast({ title: 'Error', description: err.message || 'Connection failed', type: 'error' });
    }
  };

  const performDisconnect = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/auth/github`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast({ title: 'Disconnected', type: 'success' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        addToast({ title: 'Error', description: data.error || 'Failed to disconnect', type: 'error' });
      }
    } catch (err) {
      addToast({ title: 'Error', description: err.message || 'Failed to disconnect', type: 'error' });
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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <NotificationMenu />
        </div>
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
          // profile & credentials
        </div>

        {/* Profile Edit Section */}
        <Section icon={<User size={12} />} label="Edit Profile">
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            
            {/* Avatar Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="profile-avatar-lg" style={{ width: 56, height: 56, fontSize: '1.2rem', flexShrink: 0 }}>
                {photoURLInput ? (
                  <img src={photoURLInput} alt="Avatar Preview" onError={(e) => { e.target.style.display='none'; }} />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Image size={11} /> Avatar Photo URL
                </label>
                <input
                  type="url"
                  value={photoURLInput}
                  onChange={e => setPhotoURLInput(e.target.value)}
                  placeholder="https://..."
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: '#666', alignSelf: 'center' }}>Presets:</span>
                  {['coder', 'dev', 'bot', 'cyber', 'neon'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetAvatar(preset)}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #2b2b2b',
                        color: '#aaa',
                        borderRadius: 3,
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Name Input */}
            <div>
              <label className="form-label" style={{ marginBottom: '0.3rem' }}>
                Unique Display Name / Username
              </label>
              <input
                type="text"
                required
                value={displayNameInput}
                onChange={e => {
                  setDisplayNameInput(e.target.value);
                  setProfileError('');
                  setSuggestions([]);
                }}
                className="form-input"
                placeholder="e.g. dev_coder"
                style={{ fontSize: '0.9rem' }}
              />
              {profileError && (
                <div style={{ color: '#ff6060', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  {profileError}
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#141414', border: '1px solid #2b2b2b', borderRadius: 4 }}>
                  <div style={{ fontSize: '0.75rem', color: '#aaaaaa', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={12} color="#ffb703" /> Suggested Available Usernames:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        style={{
                          background: '#ffffff',
                          color: '#000000',
                          border: 'none',
                          borderRadius: 3,
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Check size={12} /> {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
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

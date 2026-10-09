import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Settings, LogOut, Code, Clock, Trash2, Terminal, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import NotificationMenu from '../components/ui/NotificationMenu';
import { API_BASE_URL } from '../config/api';
import { parseJsonResponse } from '../utils/apiUtils';

/* ── Mono Background ──────────────────────────────────────── */
const MonoBg = () => (
  <div className="mono-bg">
    <div className="mono-bg-grid" />
    <div className="mono-bg-noise" />
    <div className="mono-bg-vignette" />
  </div>
);

const LANGS = ['javascript','typescript','python','rust','go','cpp','java','html','css'];
const LANG_DOT = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab',
  rust: '#ce422b',       go: '#00add8',         cpp: '#659bd3',
  java: '#ed8b00',       html: '#e34c26',        css: '#264de4',
};

const timeAgo = (d) => {
  const s = Math.round((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── Skeleton loader ──────────────────────────────────────── */
const SkeletonCard = () => <div className="skeleton" style={{ minHeight: 160 }} />;

/* ── Project Card ─────────────────────────────────────────── */
const ProjectCard = ({ project, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{ position: 'relative' }}
  >
    <Link
      to={`/room/${project._id}`}
      className="project-card"
      style={{ display: 'block', minHeight: 160 }}
    >
      <div className="project-card-header">
        <div className="project-card-icon">
          <Code size={14} />
        </div>
        <button
          className="btn-icon danger"
          onClick={e => { e.preventDefault(); onDelete(project); }}
          title="Delete project"
          style={{ opacity: 0 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
          id={`delete-btn-${project._id}`}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <h3 className="project-card-title">{project.name}</h3>
      <div className="project-card-meta">
        <span
          style={{
            width: 8, height: 8, borderRadius: '50%',
            background: LANG_DOT[project.language] || '#888',
            display: 'inline-block', flexShrink: 0
          }}
        />
        {project.language}
        <span style={{ color: '#404040', margin: '0 0.25rem' }}>·</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
          Owner: {project.owner?.displayName || 'Owner'}
        </span>
        <span style={{ color: '#404040', margin: '0 0.25rem' }}>·</span>
        <Clock size={10} />
        {timeAgo(project.updatedAt || project.createdAt)}
      </div>

      <div className="project-card-footer">
        <div className="collab-stack">
          {(project.collaborators || []).slice(0, 3).map((c, i) => (
            <div className="collab-avatar" key={i} title={c.displayName || ''}>
              {c.photoURL
                ? <img src={c.photoURL} alt="" />
                : (c.displayName || '?')[0].toUpperCase()
              }
            </div>
          ))}
          {(project.collaborators || []).length > 3 && (
            <div className="collab-avatar collab-extra">
              +{project.collaborators.length - 3}
            </div>
          )}
        </div>
        <ArrowRight size={14} style={{ color: '#404040', transition: 'color 120ms' }} />
      </div>
    </Link>
  </motion.div>
);

/* ── Dashboard Main ───────────────────────────────────────── */
const Dashboard = () => {
  const { currentUser, dbUser, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', language: 'javascript' });
  const [projectToDelete, setProjectToDelete] = useState(null);
  const { addToast } = useToast();

  useEffect(() => { fetchProjects(); }, [currentUser]);

  const fetchProjects = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await parseJsonResponse(res);
      if (res.ok && Array.isArray(data)) {
        setProjects(data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newProject)
      });
      const data = await parseJsonResponse(res);
      if (res.ok && data._id) {
        addToast({ title: 'Project created', type: 'success' });
        setProjects(prev => [data, ...prev]);
        setShowModal(false);
        setNewProject({ name: '', language: 'javascript' });
        navigate(`/room/${data._id}`);
      } else {
        addToast({ title: 'Error', description: data.error || 'Failed to create project', type: 'error' });
      }
    } catch (err) {
      console.error('Create project error:', err);
      addToast({ title: 'Error', description: err.message || 'Failed to connect to server', type: 'error' });
    }
  };

  const performDelete = async () => {
    if (!projectToDelete) return;
    try {
      const token = getToken();
      await fetch(`${API_BASE_URL}/api/projects/${projectToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(prev => prev.filter(p => p._id !== projectToDelete._id));
      addToast({ title: 'Project deleted', type: 'success' });
    } catch {
      addToast({ title: 'Error', description: 'Failed to delete', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = dbUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-layout">
      <MonoBg />

      {/* Header */}
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 2,
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Terminal size={13} color="#0a0a0a" />
          </div>
          <span className="dashboard-logo-text">CodeSphere</span>
        </div>
        <div className="dashboard-nav-right">
          {dbUser?.role === 'admin' && (
            <Link 
              to="/admin" 
              className="btn btn-secondary" 
              style={{ 
                padding: '0.35rem 0.75rem', 
                fontSize: '0.75rem', 
                gap: '0.4rem', 
                borderRadius: 2,
                border: '1px solid rgba(255,170,0,0.3)',
                color: '#ffaa00',
                background: 'rgba(255,170,0,0.08)',
                display: 'flex',
                alignItems: 'center'
              }} 
              title="Admin Control Center"
            >
              <ShieldAlert size={13} color="#ffaa00" />
              <span>Admin Panel</span>
            </Link>
          )}
          <NotificationMenu onNotificationAction={fetchProjects} />
          <Link to="/settings" className="btn-icon" title="Settings"><Settings size={14} /></Link>
          <button className="btn-icon" onClick={handleLogout} title="Sign out"><LogOut size={14} /></button>
          <div className="user-avatar" title={displayName}>
            {dbUser?.photoURL
              ? <img src={dbUser.photoURL} alt="Avatar" />
              : initial
            }
          </div>
        </div>
      </header>

      {/* Main */}
      <motion.main
        className="dashboard-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
      >
        {/* Top bar */}
        <div className="dashboard-top">
          <div>
            <p className="dashboard-greeting">{greeting()},</p>
            <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {displayName}
              {dbUser?.role === 'admin' && (
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: "'Space Mono', monospace",
                  padding: '2px 8px',
                  borderRadius: 3,
                  background: 'rgba(255,170,0,0.15)',
                  color: '#ffaa00',
                  border: '1px solid rgba(255,170,0,0.3)',
                  fontWeight: 700
                }}>
                  ADMIN
                </span>
              )}
            </h1>
            <p className="dashboard-subtitle">
              {projects.length === 0 ? '// no projects yet' : `// ${projects.length} project${projects.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ borderRadius: 2, gap: '0.5rem', padding: '0.65rem 1.25rem' }}
            onClick={() => setShowModal(true)}
          >
            <Plus size={15} /> New Room
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="project-grid">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Code size={24} /></div>
            <h2 className="empty-title">No Projects</h2>
            <p className="empty-desc">Create your first room to start coding.</p>
            <button
              className="btn-hero"
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} /> Open a Room
            </button>
          </div>
        ) : (
          <div className="project-grid">
            <AnimatePresence>
              {projects.map(p => (
                <ProjectCard key={p._id} project={p} onDelete={setProjectToDelete} />
              ))}
            </AnimatePresence>
            {/* New project cell */}
            <div className="project-card-new" onClick={() => setShowModal(true)}>
              <div className="project-card-new-icon"><Plus size={18} /></div>
              <span>New Room</span>
            </div>
          </div>
        )}
      </motion.main>

      {/* New Project Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Room</DialogTitle>
            <DialogDescription>Set up your collaborative coding room.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Room Name</label>
              <input
                type="text"
                required
                value={newProject.name}
                onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                className="form-input"
                placeholder="my-project"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={performDelete}
        title="Delete Room?"
        description={`"${projectToDelete?.name}" will be permanently deleted.`}
        confirmText="Delete"
        isDanger
      />
    </div>
  );
};

export default Dashboard;

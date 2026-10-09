import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  FolderGit2, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  UserCheck, 
  UserX, 
  ExternalLink, 
  Activity, 
  Server, 
  Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import Button from '../components/ui/Button';
import { API_BASE_URL } from '../config/api';
import { parseJsonResponse } from '../utils/apiUtils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { dbUser, getToken } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'projects'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  // Confirmation modals
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    isDanger: true
  });

  const fetchAdminData = async () => {
    setRefreshing(true);
    const token = getToken();
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes, projectsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/users`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/projects`, { headers })
      ]);

      const [statsData, usersData, projectsData] = await Promise.all([
        parseJsonResponse(statsRes),
        parseJsonResponse(usersRes),
        parseJsonResponse(projectsRes)
      ]);

      if (statsRes.ok) setStats(statsData);
      if (usersRes.ok && Array.isArray(usersData)) setUsers(usersData);
      if (projectsRes.ok && Array.isArray(projectsData)) setProjects(projectsData);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
      addToast({ title: 'Error', description: 'Failed to fetch admin data', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const isDemote = newRole === 'user';

    setConfirmModal({
      isOpen: true,
      title: `${isDemote ? 'Demote' : 'Promote'} ${user.displayName}?`,
      description: isDemote 
        ? `This will remove administrator permissions from ${user.email}.`
        : `This will grant full administrative privileges to ${user.email}.`,
      isDanger: isDemote,
      onConfirm: async () => {
        try {
          const token = getToken();
          const res = await fetch(`${API_BASE_URL}/api/admin/users/${user._id}/role`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
          });
          const data = await parseJsonResponse(res);
          if (res.ok) {
            addToast({ title: 'Role Updated', description: `${user.displayName} is now an ${newRole}`, type: 'success' });
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u));
            if (stats) {
              setStats(prev => ({
                ...prev,
                adminCount: isDemote ? prev.adminCount - 1 : prev.adminCount + 1
              }));
            }
          } else {
            addToast({ title: 'Error', description: data.error || 'Failed to update role', type: 'error' });
          }
        } catch (err) {
          addToast({ title: 'Error', description: err.message, type: 'error' });
        }
      }
    });
  };

  const handleDeleteUser = (user) => {
    if (user._id === dbUser?._id) {
      addToast({ title: 'Action Prohibited', description: 'Cannot delete your active account', type: 'error' });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Permanently delete ${user.displayName}?`,
      description: `This will erase ${user.email} and purge all their hosted projects and notifications.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const token = getToken();
          const res = await fetch(`${API_BASE_URL}/api/admin/users/${user._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await parseJsonResponse(res);
          if (res.ok) {
            addToast({ title: 'User Deleted', description: `${user.email} was removed`, type: 'success' });
            setUsers(prev => prev.filter(u => u._id !== user._id));
            setProjects(prev => prev.filter(p => (p.owner?._id || p.owner) !== user._id));
            if (stats) {
              setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
            }
          } else {
            addToast({ title: 'Error', description: data.error || 'Failed to delete user', type: 'error' });
          }
        } catch (err) {
          addToast({ title: 'Error', description: err.message, type: 'error' });
        }
      }
    });
  };

  const handleDeleteProject = (project) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete project "${project.name}"?`,
      description: `This will permanently delete this collaborative room for all members.`,
      isDanger: true,
      onConfirm: async () => {
        try {
          const token = getToken();
          const res = await fetch(`${API_BASE_URL}/api/admin/projects/${project._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await parseJsonResponse(res);
          if (res.ok) {
            addToast({ title: 'Project Deleted', description: `Room "${project.name}" deleted`, type: 'success' });
            setProjects(prev => prev.filter(p => p._id !== project._id));
            if (stats) {
              setStats(prev => ({ ...prev, totalProjects: prev.totalProjects - 1 }));
            }
          } else {
            addToast({ title: 'Error', description: data.error || 'Failed to delete project', type: 'error' });
          }
        } catch (err) {
          addToast({ title: 'Error', description: err.message, type: 'error' });
        }
      }
    });
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearch.trim() || 
      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredProjects = projects.filter(p => {
    return !projectSearch.trim() || 
      p.name?.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.owner?.displayName?.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.language?.toLowerCase().includes(projectSearch.toLowerCase());
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', paddingBottom: '3rem' }}>
      
      {/* Top Header */}
      <header style={{
        borderBottom: '1px solid #1a1a1a',
        background: '#0d0d0d',
        padding: '0.875rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{
              background: '#141414',
              border: '1px solid #222',
              color: '#aaa',
              padding: '0.45rem 0.75rem',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem'
            }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
              CodeSphere / Admin Control Center
            </span>
            <span style={{
              fontSize: '0.65rem',
              letterSpacing: '0.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 3,
              background: 'rgba(255, 170, 0, 0.15)',
              color: '#ffaa00',
              border: '1px solid rgba(255, 170, 0, 0.3)'
            }}>
              SUPERUSER PRIVILEGES
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={fetchAdminData}
            disabled={refreshing}
            style={{
              background: '#141414',
              border: '1px solid #222',
              color: '#fff',
              padding: '0.45rem 0.85rem',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem'
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            background: '#141414',
            border: '1px solid #222',
            borderRadius: 4,
            fontSize: '0.8rem'
          }}>
            <ShieldCheck size={14} color="#44ff88" />
            <span>{dbUser?.displayName} (Admin)</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem' }}>
        
        {/* Metric Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem' }}>Total Accounts</span>
              <Users size={18} color="#3178c6" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
              {stats?.totalUsers ?? '...'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.35rem' }}>
              {stats?.adminCount ?? 0} active administrators
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem' }}>Total Hosted Rooms</span>
              <FolderGit2 size={18} color="#00add8" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
              {stats?.totalProjects ?? '...'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.35rem' }}>
              Real-time collaborative workspaces
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem' }}>Platform Uptime</span>
              <Activity size={18} color="#44ff88" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
              {stats?.serverUptime ? `${Math.floor(stats.serverUptime / 60)}m` : 'Online'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.35rem' }}>
              Node {stats?.nodeVersion || 'v20+'} · MongoDB Active
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem' }}>Access Level</span>
              <ShieldAlert size={18} color="#ffaa00" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: "'Space Mono', monospace", color: '#ffaa00' }}>
              Root / Admin
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.35rem' }}>
              Full CRUD on accounts & projects
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #222',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              background: activeTab === 'overview' ? '#222' : 'transparent',
              color: activeTab === 'overview' ? '#fff' : '#888',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              background: activeTab === 'users' ? '#222' : 'transparent',
              color: activeTab === 'users' ? '#fff' : '#888',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            style={{
              background: activeTab === 'projects' ? '#222' : 'transparent',
              color: activeTab === 'projects' ? '#fff' : '#888',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            All Projects ({projects.length})
          </button>
        </div>

        {/* Tab 1: System Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Recent Users */}
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Latest Registered Users</h4>
                <button 
                  onClick={() => setActiveTab('users')}
                  style={{ background: 'none', border: 'none', color: '#3178c6', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  View All &rarr;
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(stats?.recentUsers || []).map(u => (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: '#141414', borderRadius: 4, border: '1px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {u.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.displayName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#666' }}>{u.email}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: u.role === 'admin' ? 'rgba(255,170,0,0.15)' : '#1e1e1e',
                      color: u.role === 'admin' ? '#ffaa00' : '#888'
                    }}>
                      {u.role?.toUpperCase() || 'USER'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Latest Active Projects</h4>
                <button 
                  onClick={() => setActiveTab('projects')}
                  style={{ background: 'none', border: 'none', color: '#3178c6', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  View All &rarr;
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(stats?.recentProjects || []).map(p => (
                  <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: '#141414', borderRadius: 4, border: '1px solid #1a1a1a' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#666' }}>
                        Owner: {p.owner?.displayName || 'Unknown'} · {p.language}
                      </div>
                    </div>
                    <Link
                      to={`/room/${p._id}`}
                      style={{
                        padding: '0.3rem 0.6rem',
                        background: '#222',
                        color: '#fff',
                        borderRadius: 3,
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <span>Join</span> <ExternalLink size={11} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, overflow: 'hidden' }}>
            {/* Filter Bar */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #222', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#666' }} />
                <input
                  type="text"
                  placeholder="Search by user email or display name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #2a2a2a',
                    padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                    color: '#fff',
                    borderRadius: 4,
                    fontSize: '0.85rem'
                  }}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  background: '#161616',
                  border: '1px solid #2a2a2a',
                  color: '#fff',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 4,
                  fontSize: '0.85rem'
                }}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Users Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', background: '#0e0e0e', color: '#888' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Projects</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Joined</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const isSelf = user._id === dbUser?._id;
                    const isAdmin = user.role === 'admin';

                    return (
                      <tr key={user._id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                              {user.displayName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <span style={{ fontWeight: 600 }}>{user.displayName}</span>
                              {isSelf && (
                                <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#44ff88' }}>(You)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#aaa', fontFamily: 'monospace' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 3,
                            background: isAdmin ? 'rgba(255,170,0,0.15)' : '#1e1e1e',
                            color: isAdmin ? '#ffaa00' : '#888',
                            border: isAdmin ? '1px solid rgba(255,170,0,0.3)' : '1px solid #2a2a2a'
                          }}>
                            {isAdmin ? 'ADMIN' : 'USER'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#aaa' }}>
                          {user.projectCount ?? 0}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.78rem' }}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleRole(user)}
                                title={isAdmin ? 'Demote to regular user' : 'Promote to admin'}
                                style={{
                                  background: '#181818',
                                  border: '1px solid #2a2a2a',
                                  color: isAdmin ? '#ffaa00' : '#44ff88',
                                  borderRadius: 4,
                                  padding: '0.35rem 0.65rem',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                {isAdmin ? <UserX size={12} /> : <UserCheck size={12} />}
                                {isAdmin ? 'Demote' : 'Make Admin'}
                              </button>
                            )}
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                title="Delete User and Projects"
                                style={{
                                  background: 'rgba(255,68,68,0.1)',
                                  border: '1px solid rgba(255,68,68,0.3)',
                                  color: '#ff5555',
                                  borderRadius: 4,
                                  padding: '0.35rem 0.55rem',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Projects Management */}
        {activeTab === 'projects' && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, overflow: 'hidden' }}>
            {/* Filter Bar */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #222' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#666' }} />
                <input
                  type="text"
                  placeholder="Search project by title, language or owner..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#161616',
                    border: '1px solid #2a2a2a',
                    padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                    color: '#fff',
                    borderRadius: 4,
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Projects Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', background: '#0e0e0e', color: '#888' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Project Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Language</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Owner</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Collaborators</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Last Modified</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                      No hosted projects found.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(proj => (
                    <tr key={proj._id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {proj.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 3,
                          background: '#181818',
                          border: '1px solid #282828',
                          fontSize: '0.75rem'
                        }}>
                          {proj.language}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#aaa' }}>
                        {proj.owner?.displayName || 'Unknown'} ({proj.owner?.email || 'N/A'})
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#666' }}>
                        {proj.collaborators?.length ?? 1} members
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.78rem' }}>
                        {proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Link
                            to={`/room/${proj._id}`}
                            style={{
                              background: '#181818',
                              border: '1px solid #2a2a2a',
                              color: '#fff',
                              borderRadius: 4,
                              padding: '0.35rem 0.65rem',
                              textDecoration: 'none',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <span>Inspect Room</span> <ExternalLink size={11} />
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(proj)}
                            title="Force Delete Room"
                            style={{
                              background: 'rgba(255,68,68,0.1)',
                              border: '1px solid rgba(255,68,68,0.3)',
                              color: '#ff5555',
                              borderRadius: 4,
                              padding: '0.35rem 0.55rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText="Confirm Action"
        isDanger={confirmModal.isDanger}
      />

    </div>
  );
};

export default AdminDashboard;

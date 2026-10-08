import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Code, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from './Toast';
import { API_BASE_URL } from '../../config/api';

const NotificationMenu = ({ onNotificationAction }) => {
  const { getToken } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json().catch(() => ([]));
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRespond = async (id, action) => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        addToast({
          title: action === 'accept' ? 'Invitation Accepted' : 'Invitation Rejected',
          type: action === 'accept' ? 'success' : 'info'
        });
        fetchNotifications();
        if (onNotificationAction) onNotificationAction();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast({ title: 'Error', description: errData.error || 'Action failed', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const pendingList = notifications.filter(n => n.status === 'pending');
  const unreadCount = pendingList.length;

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        className="btn-icon"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        style={{ position: 'relative' }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            background: '#ff4444',
            color: '#ffffff',
            borderRadius: '50%',
            width: 14,
            height: 14,
            fontSize: '0.65rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: 320,
          maxHeight: 380,
          background: '#111111',
          border: '1px solid #2b2b2b',
          borderRadius: 6,
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.8)',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #1f1f1f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.75rem',
            color: '#888888',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ color: '#ffffff', background: '#222222', padding: '1px 6px', borderRadius: 3, fontSize: '0.7rem' }}>
                {unreadCount} new
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#555555', fontSize: '0.8rem' }}>
                No notifications
              </div>
            ) : (
              notifications.map(n => {
                const isPending = n.status === 'pending';
                return (
                  <div
                    key={n._id}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      background: isPending ? '#161616' : '#0d0d0d',
                      border: `1px solid ${isPending ? '#2a2a2a' : '#1a1a1a'}`,
                      borderRadius: 4
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <div className="collab-avatar" style={{ margin: 0, width: 22, height: 22, fontSize: '0.65rem' }}>
                        {n.sender?.photoURL ? (
                          <img src={n.sender.photoURL} alt="" />
                        ) : (
                          (n.sender?.displayName || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>
                        {n.sender?.displayName}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#aaaaaa', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                      Invited you to join project <strong style={{ color: '#ffffff' }}>{n.project?.name || 'Project'}</strong>
                    </div>

                    {isPending ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          disabled={loading}
                          onClick={() => handleRespond(n._id, 'accept')}
                          style={{
                            flex: 1,
                            padding: '0.35rem',
                            background: '#ffffff',
                            color: '#000000',
                            border: 'none',
                            borderRadius: 3,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Check size={12} /> Accept
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => handleRespond(n._id, 'reject')}
                          style={{
                            flex: 1,
                            padding: '0.35rem',
                            background: '#1a1a1a',
                            color: '#ff6060',
                            border: '1px solid rgba(255, 96, 96, 0.3)',
                            borderRadius: 3,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.7rem', color: n.status === 'accepted' ? '#44ff88' : '#888888', fontStyle: 'italic' }}>
                        {n.status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, UserPlus, UserMinus, RotateCcw } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../ui/Toast';
import { API_BASE_URL } from '../../config/api';

const PeoplePanel = ({ roomId, project, setProject }) => {
  const { dbUser, getToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [invites, setInvites] = useState([]);
  const [searching, setSearching] = useState(false);
  const [collabToRemove, setCollabToRemove] = useState(null);
  const { addToast } = useToast();

  const isOwner = project?.owner?._id === dbUser?._id;

  const fetchProjectInvites = async () => {
    if (!roomId) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/notifications/project/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (err) {
      console.error('Failed to fetch project invites', err);
    }
  };

  useEffect(() => {
    fetchProjectInvites();
  }, [roomId]);

  // Instant autocomplete search starting from 1st letter
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/api/auth/users/search?query=${encodeURIComponent(query.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Instant search error', err);
      } finally {
        setSearching(false);
      }
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const sendInvitation = async (userId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/projects/${roomId}/collaborators`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      if (res.ok) {
        addToast({ title: 'Invitation Sent', description: 'Collaborator will receive notification to accept/reject', type: 'success' });
        fetchProjectInvites();
      } else {
        addToast({ title: 'Notice', description: data.error || 'Failed to send invitation', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to send invitation', type: 'error' });
    }
  };

  const performRemoveCollaborator = async () => {
    if (!collabToRemove) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/projects/${roomId}/collaborators/${collabToRemove}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        addToast({ title: 'Collaborator Removed', type: 'success' });
      } else {
        const data = await res.json();
        addToast({ title: 'Error', description: data.error || 'Failed to remove collaborator', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to remove collaborator', type: 'error' });
    }
  };

  // Combine owner and collaborators
  const allPeople = project ? [project.owner, ...(project.collaborators || []).filter(c => c._id !== project.owner?._id)] : [];

  return (
    <div className="people-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '2rem' }}>
      
      {isOwner && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Add Collaborator</h3>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type name or email (instant search)..." 
              className="chat-input"
              style={{ flex: 1, padding: '0.45rem 0.6rem 0.45rem 2rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: 8, color: '#666' }} />
          </div>
          
          {query.trim().length > 0 && (
            <div style={{ marginTop: '0.5rem', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
              {searching ? (
                <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#888' }}>Searching...</div>
              ) : results.length === 0 ? (
                <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#888' }}>No users found matching "{query}"</div>
              ) : (
                results.map(user => {
                  const isAlreadyCollab = allPeople.some(p => p._id === user._id);
                  const existingInvite = invites.find(inv => inv.recipient?._id === user._id || inv.recipient === user._id);
                  const isPending = existingInvite?.status === 'pending';
                  const isRejected = existingInvite?.status === 'rejected';

                  return (
                    <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <div className="collab-avatar" style={{ margin: 0, width: '1.5rem', height: '1.5rem', fontSize: '0.7rem', flexShrink: 0 }}>
                          {user.photoURL ? <img src={user.photoURL} alt="Collab" /> : <span>{user.displayName?.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.displayName}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {isAlreadyCollab ? (
                          <span style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>Member</span>
                        ) : isPending ? (
                          <span style={{ fontSize: '0.7rem', color: '#ffb703', background: 'rgba(255,183,3,0.1)', padding: '2px 6px', borderRadius: 3 }}>
                            Pending
                          </span>
                        ) : isRejected ? (
                          <button
                            onClick={() => sendInvitation(user._id)}
                            className="btn"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Invitation was rejected. Owner can resend."
                          >
                            <RotateCcw size={10} /> Resend
                          </button>
                        ) : (
                          <button
                            onClick={() => sendInvitation(user._id)}
                            className="btn"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <UserPlus size={12} /> Invite
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>Project Members</h3>
      <div className="people-list" style={{ flex: 1, overflowY: 'auto' }}>
        {allPeople.map(person => (
          <div key={person._id} className="people-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div className="collab-avatar" style={{ margin: 0, width: '2.5rem', height: '2.5rem' }}>
              {person.photoURL ? <img src={person.photoURL} alt="Avatar" /> : <span>{person.displayName?.charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <div className="people-name" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                {person.displayName} {person._id === dbUser?._id && '(You)'}
              </div>
              <div className="people-status" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {person._id === project?.owner?._id ? 'Owner' : 'Collaborator'}
              </div>
            </div>
            {isOwner && person._id !== project?.owner?._id && (
              <div style={{ marginLeft: 'auto' }}>
                <button onClick={() => setCollabToRemove(person._id)} className="icon-btn" style={{ padding: '0.2rem', color: 'var(--danger)' }} title="Remove Collaborator">
                  <UserMinus size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal 
        isOpen={!!collabToRemove}
        onClose={() => setCollabToRemove(null)}
        onConfirm={performRemoveCollaborator}
        title="Remove Collaborator?"
        description="Are you sure you want to remove this collaborator from the project?"
        confirmText="Remove"
        isDanger={true}
      />
    </div>
  );
};

export default PeoplePanel;

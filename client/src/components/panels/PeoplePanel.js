import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, UserPlus, UserMinus } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../ui/Toast';

const PeoplePanel = ({ roomId, project, setProject }) => {
  const { dbUser, getToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [collabToRemove, setCollabToRemove] = useState(null);
  const { addToast } = useToast();

  const isOwner = project?.owner?._id === dbUser?._id;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/auth/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addCollaborator = async (userId) => {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/projects/${roomId}/collaborators`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        addToast({ title: 'Collaborator Added', type: 'success' });
        // Do NOT clear results so user can add multiple collaborators easily
      } else {
        const data = await res.json();
        addToast({ title: 'Error', description: data.error || 'Failed to add collaborator', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to add collaborator', type: 'error' });
    }
  };

  const performRemoveCollaborator = async () => {
    if (!collabToRemove) return;
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/projects/${roomId}/collaborators/${collabToRemove}`, {
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
  const allPeople = project ? [project.owner, ...project.collaborators.filter(c => c._id !== project.owner._id)] : [];

  return (
    <div className="people-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '2rem' }}>
      
      {isOwner && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Add Collaborator</h3>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email or name..." 
              className="chat-input"
              style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', backgroundColor: 'transparent', color: 'var(--text-primary)' }}
            />
            <button type="submit" className="chat-send-btn" disabled={searching}>
              <Search size={16} />
            </button>
          </form>
          
          {results.length > 0 && (
            <div style={{ marginTop: '0.5rem', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              {results.map(user => {
                const isAlreadyCollab = allPeople.some(p => p._id === user._id);
                return (
                  <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="collab-avatar" style={{ margin: 0, width: '1.5rem', height: '1.5rem', fontSize: '0.7rem' }}>
                        {user.photoURL ? <img src={user.photoURL} alt="Collab" /> : <span>{user.displayName?.charAt(0).toUpperCase()}</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{user.displayName}</div>
                    </div>
                    {!isAlreadyCollab && (
                      <button onClick={() => addCollaborator(user._id)} className="icon-btn" style={{ padding: '0.2rem', color: 'var(--accent)' }}>
                        <UserPlus size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
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
                {person._id === project.owner._id ? 'Owner' : 'Collaborator'}
              </div>
            </div>
            {isOwner && person._id !== project.owner._id && (
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

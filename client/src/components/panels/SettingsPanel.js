import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, AlertTriangle } from 'lucide-react';

const SettingsPanel = ({ roomId, project }) => {
  const { dbUser, getToken } = useAuth();
  const navigate = useNavigate();

  const isOwner = project?.owner?._id === dbUser?._id;

  const handleDeleteProject = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete this project? This cannot be undone.")) return;
    
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/projects/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        navigate('/dashboard');
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete project");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting project.");
    }
  };

  return (
    <div className="settings-panel" style={{ padding: '1rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f4f4f5', marginBottom: '1.5rem' }}>Project Settings</h3>
      
      {isOwner ? (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '0.5rem', fontWeight: 600 }}>
            <AlertTriangle size={18} />
            Danger Zone
          </div>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Once you delete a project, there is no going back. Please be certain.
          </p>
          <button 
            onClick={handleDeleteProject}
            className="btn-glow"
            style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'transparent' }}
          >
            <Trash2 size={16} /> Delete Project
          </button>
        </div>
      ) : (
        <div style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
          Only the project owner can view and modify project settings.
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;

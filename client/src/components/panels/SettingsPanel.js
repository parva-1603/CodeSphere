import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';

const SettingsPanel = ({ roomId, project }) => {
  const { dbUser, getToken } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const { addToast } = useToast();

  const isOwner = project?.owner?._id === dbUser?._id;

  const performDeleteProject = async () => {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/projects/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast({ title: 'Success', description: 'Project deleted', type: 'success' });
        navigate('/dashboard');
      } else {
        const data = await res.json();
        addToast({ title: 'Error', description: data.error || "Failed to delete project", type: 'error' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: "Error deleting project.", type: 'error' });
    }
  };

  return (
    <div className="settings-panel" style={{ padding: '1rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Project Settings</h3>
      
      {isOwner ? (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 600 }}>
            <AlertTriangle size={18} />
            Danger Zone
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Once you delete a project, there is no going back. Please be certain.
          </p>
          <Button 
            onClick={() => setShowConfirm(true)}
            variant="secondary"
            style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'transparent' }}
          >
            <Trash2 size={16} style={{ marginRight: '6px' }} /> Delete Project
          </Button>
        </div>
      ) : (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          Only the project owner can view and modify project settings.
        </div>
      )}

      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={performDeleteProject}
        title="Delete Project?"
        description="Are you absolutely sure you want to delete this project? This cannot be undone."
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default SettingsPanel;

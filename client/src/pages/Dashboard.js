import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Settings, LogOut, Code, Calendar, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, dbUser, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', language: 'javascript' });

  useEffect(() => {
    fetchProjects();
  }, [currentUser]);

  const fetchProjects = async () => {
    if (!currentUser) return;
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/room/${data._id}`);
      }
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete project");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="bg-gradient-container">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
      </div>
      
      <header className="dashboard-header">
        <div className="dashboard-logo">CodeSphere</div>
        <div className="dashboard-nav-actions">
          <Link to="/settings" className="icon-btn">
            <Settings className="w-5 h-5" />
          </Link>
          <div className="user-avatar">
            {dbUser?.photoURL ? (
              <img src={dbUser.photoURL} alt="Avatar" />
            ) : (
              <span>{dbUser?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <button onClick={logout} className="icon-btn danger">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-top">
          <div>
            <h1 className="dashboard-title">Your Projects</h1>
            <p className="dashboard-subtitle">Jump back into your collaborative workspaces.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-glow"
          >
            <Plus className="w-5 h-5" /> New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Code size={40} />
            </div>
            <h3 className="empty-title">No projects yet</h3>
            <p className="empty-desc">Create your first project to start collaborating.</p>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-outline"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map(project => (
              <Link 
                to={`/room/${project._id}`} 
                key={project._id}
                className="project-card"
                style={{ position: 'relative' }}
              >
                <div className="project-card-top">
                  <h3 className="project-card-title">{project.name}</h3>
                </div>
                <div className="project-date">
                  <Calendar size={16} />
                  {new Date(project.updatedAt).toLocaleDateString()}
                </div>
                <div className="project-collaborators">
                  {project.collaborators.slice(0, 3).map((collab, i) => (
                    <div key={i} className="collab-avatar" title={collab.displayName}>
                      {collab.photoURL ? (
                        <img src={collab.photoURL} alt="Collab" />
                      ) : (
                        <span>{collab.displayName?.charAt(0).toUpperCase() || '?'}</span>
                      )}
                    </div>
                  ))}
                  {project.collaborators.length > 3 && (
                    <div className="collab-avatar collab-extra">
                      +{project.collaborators.length - 3}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="modal-form-group">
                <label className="modal-label">Project Name</label>
                <input 
                  type="text" 
                  required
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="modal-input"
                  placeholder="e.g. Awesome App"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-glow"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

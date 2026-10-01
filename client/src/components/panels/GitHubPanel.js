import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GitBranch, Download, Upload, FolderDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const GitHubPanel = ({ getEditorValue, setEditorValue, setMultipleFiles, activeFile }) => {
  const { dbUser, getToken } = useAuth();
  const [repo, setRepo] = useState('');
  const [filePath, setFilePath] = useState('');
  const [branch, setBranch] = useState('main');
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (activeFile) {
      setFilePath(activeFile);
    }
  }, [activeFile]);

  if (!dbUser?.githubUsername) {
    return (
      <div className="github-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-icon-wrap" style={{ marginBottom: '1rem' }}>
          <GitBranch size={32} />
        </div>
        <h3 className="empty-title">GitHub Not Connected</h3>
        <p className="empty-desc" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Connect your GitHub account in Settings to pull and push code directly from this room.
        </p>
        <Link to="/settings" className="btn-glow">
          Go to Settings
        </Link>
      </div>
    );
  }

  const parseRepo = (input) => {
    let clean = input.trim();
    if (clean.includes('github.com/')) {
      clean = clean.split('github.com/')[1];
    }
    if (clean.endsWith('.git')) {
      clean = clean.slice(0, -4);
    }
    
    const parts = clean.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  };

  const handlePullRepo = async () => {
    if (!repo) return alert("Repository is required.");
    try {
      setIsPulling(true);
      const parsed = parseRepo(repo);
      if (!parsed) {
        setIsPulling(false);
        return alert("Could not parse repository. Please use format 'owner/repo' or paste the full GitHub URL.");
      }
      
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/github/pull-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ owner: parsed.owner, repo: parsed.repo, branch })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files && setMultipleFiles) {
          setMultipleFiles(data.files);
          alert(`Successfully imported ${data.files.length} files from GitHub! Check your Explorer.`);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to pull repo');
      }
    } catch (err) {
      console.error(err);
      alert('Error pulling repo. Check console.');
    } finally {
      setIsPulling(false);
    }
  };

  const handlePull = async () => {
    if (!repo || !filePath) return alert("Repository and File Path are required.");
    try {
      const parsed = parseRepo(repo);
      if (!parsed) return alert("Could not parse repository.");
      
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/github/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ owner: parsed.owner, repo: parsed.repo, path: filePath, ref: branch })
      });
      if (res.ok) {
        const data = await res.json();
        setEditorValue(data.content);
        alert('File pulled successfully! (Changes synced to all collaborators)');
      } else {
        const data = await res.json();
        if (data.error && data.error.includes('Not Found')) {
          alert('File not found on GitHub. Check path and branch.');
        } else {
          alert(data.error || 'Failed to pull file');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error pulling file.');
    }
  };

  const handlePush = async () => {
    if (!repo || !filePath) return alert("Repository and File Path are required.");
    try {
      const parsed = parseRepo(repo);
      if (!parsed) return alert("Could not parse repository.");
      
      const content = getEditorValue();
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ owner: parsed.owner, repo: parsed.repo, path: filePath, branch, content })
      });
      if (res.ok) {
        alert('File pushed to GitHub successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to push file');
      }
    } catch (err) {
      console.error(err);
      alert('Error pushing file');
    }
  };

  return (
    <div className="github-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
        <GitBranch size={20} />
        <span>Connected as {dbUser.githubUsername}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="modal-form-group" style={{ marginBottom: 0 }}>
          <label className="modal-label">Repository</label>
          <input 
            type="text" 
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="e.g. facebook/react"
            className="modal-input"
          />
        </div>
        <div className="modal-form-group" style={{ marginBottom: 0 }}>
          <label className="modal-label">Branch</label>
          <input 
            type="text" 
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="modal-input"
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}></div>

        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-color)' }}>Full Project</h4>
        <p style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Clone the entire repository into your workspace.</p>
        <button onClick={handlePullRepo} className="github-btn" style={{ width: '100%', justifyContent: 'center' }} disabled={isPulling}>
          <FolderDown size={16} /> {isPulling ? 'Importing...' : 'Import Full Repo'}
        </button>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}></div>

        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-color)' }}>Single File Sync</h4>
        <div className="modal-form-group" style={{ marginBottom: 0 }}>
          <label className="modal-label">File Path</label>
          <input 
            type="text" 
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="e.g. src/index.js"
            className="modal-input"
          />
        </div>

        <div className="github-actions" style={{ marginTop: '0.5rem' }}>
          <button onClick={handlePull} className="github-btn">
            <Download size={16} /> Pull File
          </button>
          <button onClick={handlePush} className="github-btn" style={{ backgroundColor: 'var(--primary)' }}>
            <Upload size={16} /> Push File
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitHubPanel;

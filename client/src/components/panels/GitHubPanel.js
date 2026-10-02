import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GitBranch, Download, Upload, FolderDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../ui/Toast';

const GitHubPanel = ({ getEditorValue, setEditorValue, setMultipleFiles, activeFile }) => {
  const { dbUser, getToken } = useAuth();
  const [repo, setRepo] = useState('');
  const [filePath, setFilePath] = useState('');
  const [branch, setBranch] = useState('main');
  const [isPulling, setIsPulling] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (activeFile) {
      setFilePath(activeFile);
    }
  }, [activeFile]);

  if (!dbUser?.githubUsername) {
    return (
      <div className="github-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div className="empty-icon" style={{ marginBottom: '1.25rem' }}>
          <GitBranch size={28} />
        </div>
        <h3 className="empty-title">GitHub Not Connected</h3>
        <p className="empty-desc" style={{ marginBottom: '1.5rem' }}>
          Connect your GitHub account in Settings to pull and push code directly from this room.
        </p>
        <Link to="/settings" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: 10 }}>
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
    if (!repo) return addToast({ title: 'Validation Error', description: "Repository is required.", type: 'warning' });
    try {
      setIsPulling(true);
      const parsed = parseRepo(repo);
      if (!parsed) {
        setIsPulling(false);
        return addToast({ title: 'Validation Error', description: "Could not parse repository. Please use format 'owner/repo' or paste the full GitHub URL.", type: 'warning' });
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
          addToast({ title: 'Success', description: `Successfully imported ${data.files.length} files from GitHub! Check your Explorer.`, type: 'success' });
        }
      } else {
        const data = await res.json();
        addToast({ title: 'Error', description: data.error || 'Failed to pull repo', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Error pulling repo. Check console.', type: 'error' });
    } finally {
      setIsPulling(false);
    }
  };

  const handlePull = async () => {
    if (!repo || !filePath) return addToast({ title: 'Validation Error', description: "Repository and File Path are required.", type: 'warning' });
    try {
      const parsed = parseRepo(repo);
      if (!parsed) return addToast({ title: 'Validation Error', description: "Could not parse repository.", type: 'warning' });
      
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/github/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ owner: parsed.owner, repo: parsed.repo, path: filePath, ref: branch })
      });
      if (res.ok) {
        const data = await res.json();
        setEditorValue(data.content);
        addToast({ title: 'Success', description: 'File pulled successfully! (Changes synced to all collaborators)', type: 'success' });
      } else {
        const data = await res.json();
        if (data.error && data.error.includes('Not Found')) {
          addToast({ title: 'Error', description: 'File not found on GitHub. Check path and branch.', type: 'error' });
        } else {
          addToast({ title: 'Error', description: data.error || 'Failed to pull file', type: 'error' });
        }
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Error pulling file.', type: 'error' });
    }
  };

  const handlePush = async () => {
    if (!repo || !filePath) return addToast({ title: 'Validation Error', description: "Repository and File Path are required.", type: 'warning' });
    try {
      const parsed = parseRepo(repo);
      if (!parsed) return addToast({ title: 'Validation Error', description: "Could not parse repository.", type: 'warning' });
      
      const content = getEditorValue();
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ owner: parsed.owner, repo: parsed.repo, path: filePath, branch, content })
      });
      if (res.ok) {
        addToast({ title: 'Success', description: 'File pushed to GitHub successfully!', type: 'success' });
      } else {
        const data = await res.json();
        addToast({ title: 'Error', description: data.error || 'Failed to push file', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Error pushing file', type: 'error' });
    }
  };

  return (
    <div className="github-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
        <GitBranch size={20} />
        <span>Connected as {dbUser.githubUsername}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Repository</label>
          <input 
            type="text" 
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="e.g. facebook/react or paste GitHub URL"
            className="form-input"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Branch</label>
          <input 
            type="text" 
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="form-input"
          />
        </div>

        <div style={{ borderTop: '1px solid var(--c-border)', margin: '1rem 0' }}></div>

        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text-1)' }}>Full Project</h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--c-text-2)', marginBottom: '0.5rem' }}>Clone the entire repository into your workspace.</p>
        <button onClick={handlePullRepo} className="github-btn" style={{ width: '100%', justifyContent: 'center' }} disabled={isPulling}>
          <FolderDown size={16} /> {isPulling ? 'Importing...' : 'Import Full Repo'}
        </button>

        <div style={{ borderTop: '1px solid var(--c-border)', margin: '1rem 0' }}></div>

        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text-1)' }}>Single File Sync</h4>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">File Path</label>
          <input 
            type="text" 
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="e.g. src/index.js"
            className="form-input"
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

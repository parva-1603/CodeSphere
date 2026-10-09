import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from '../y-monaco.js';
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, MessageSquare, Video, Cpu, GitBranch, Users, FileCode, Search, Settings, FileText, Upload, FilePlus, FolderPlus, FolderOpen, Folder, ChevronRight, ChevronDown, Play, TerminalSquare, X, Copy, Trash2 } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import ChatPanel from '../components/panels/ChatPanel';
import CallPanel from '../components/panels/CallPanel';
import AIPanel from '../components/panels/AIPanel';
import GitHubPanel from '../components/panels/GitHubPanel';
import PeoplePanel from '../components/panels/PeoplePanel';
import SettingsPanel from '../components/panels/SettingsPanel';
import AppShell from '../layouts/AppShell';
import { API_BASE_URL, WS_BASE_URL } from '../config/api';
import { parseJsonResponse } from '../utils/apiUtils';

const Room = () => {
  const { id: roomId } = useParams();
  const { currentUser, dbUser, getToken } = useAuth();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [syncState, setSyncState] = useState('connecting');
  
  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const docRef = useRef(null);
  const bindingRef = useRef(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState('');
  const [newItem, setNewItem] = useState(null);
  
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(35);

  const startResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = terminalHeight;
    const containerHeight = terminalRef.current.parentElement.parentElement.clientHeight;

    const onMouseMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = startHeight + (deltaY / containerHeight) * 100;
      if (newHeight > 10 && newHeight < 80) {
        setTerminalHeight(newHeight);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    if (!isTerminalOpen) return;
    
    // Slight delay to ensure DOM is ready
    setTimeout(() => {
      if (!terminalRef.current) return;
      
      const term = new Terminal({
        theme: { 
          background: '#1e1e1e', 
          foreground: '#d4d4d8',
          cursor: '#8b5cf6',
          cursorAccent: '#ffffff',
          selection: 'rgba(139, 92, 246, 0.3)',
          black: '#000000',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#22d3ee',
          white: '#ffffff',
          brightBlack: '#52525b',
          brightRed: '#fca5a5',
          brightGreen: '#86efac',
          brightYellow: '#fef08a',
          brightBlue: '#93c5fd',
          brightMagenta: '#d8b4fe',
          brightCyan: '#67e8f9',
          brightWhite: '#ffffff'
        },
        fontFamily: "'JetBrains Mono', 'Menlo', 'Monaco', monospace",
        fontSize: 14,
        cursorBlink: true
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      term.open(terminalRef.current);
      fitAddon.fit();
      xtermRef.current = term;

      const ws = new WebSocket(`${WS_BASE_URL}/shell`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      let inputBuffer = '';
      let commandHistory = [];
      let historyIndex = -1;

      term.onData(data => {
        if (ws.readyState !== WebSocket.OPEN) return;

        if (data === '\r') {
          // Erase local echo
          term.write('\b \b'.repeat(inputBuffer.length));
          // Send full command
          ws.send(inputBuffer + '\r\n');
          if (inputBuffer.trim()) {
            commandHistory.push(inputBuffer);
          }
          historyIndex = commandHistory.length;
          inputBuffer = '';
        } else if (data === '\x7F') { // Backspace
          if (inputBuffer.length > 0) {
            inputBuffer = inputBuffer.slice(0, -1);
            term.write('\b \b');
          }
        } else if (data === '\x1b[A') { // Up arrow
          if (commandHistory.length > 0 && historyIndex > 0) {
            historyIndex--;
            term.write('\b \b'.repeat(inputBuffer.length));
            inputBuffer = commandHistory[historyIndex];
            term.write(inputBuffer);
          }
        } else if (data === '\x1b[B') { // Down arrow
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            term.write('\b \b'.repeat(inputBuffer.length));
            inputBuffer = commandHistory[historyIndex];
            term.write(inputBuffer);
          } else if (historyIndex === commandHistory.length - 1) {
            historyIndex++;
            term.write('\b \b'.repeat(inputBuffer.length));
            inputBuffer = '';
          }
        } else if (data === '\x03') { // Ctrl+C
          term.write('^C\r\n');
          ws.send('\x03');
          inputBuffer = '';
        } else if (data >= String.fromCharCode(0x20) && data <= String.fromCharCode(0x7E)) {
          inputBuffer += data;
          term.write(data);
        }
      });

      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        ws.close();
        term.dispose();
      };
    }, 50);
  }, [isTerminalOpen]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setError(null);
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/api/projects/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await parseJsonResponse(res);
        if (res.ok) {
          setProject(data);
        } else {
          setError(data.error || `Project not found or access denied (Status ${res.status})`);
        }
      } catch (error) {
        console.error("Failed to fetch project", error);
        setError("Failed to connect to server. Please ensure backend server is running.");
      }
    };
    if (currentUser) fetchProject();
  }, [roomId, currentUser]);

  useEffect(() => {
    if (!project) return;

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      `${WS_BASE_URL}/yjs`,
      roomId,
      doc
    );
    docRef.current = doc;
    providerRef.current = provider;

    provider.awareness.setLocalStateField('user', {
      name: dbUser?.displayName || 'Anonymous',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });

    provider.on('status', event => {
      if (event.status === 'connected') setSyncState('synced');
      else setSyncState('connecting');
    });

    const filesMap = doc.getMap('files');

    const updateFilesList = () => {
      try {
        const fileKeys = Array.from(filesMap.keys());
        setFiles([...fileKeys]);
        setActiveFile(prev => {
          if (prev && fileKeys.includes(prev)) return prev;
          return fileKeys.length > 0 ? fileKeys[0] : '';
        });
      } catch (err) {
        console.warn('[CodeSphere] File list update error:', err.message);
      }
    };

    filesMap.observe(updateFilesList);

    provider.on('sync', (isSynced) => {
      try {
        if (isSynced) {
          const fileKeys = Array.from(filesMap.keys());
          const ownerId = (project.owner?._id || project.owner)?.toString();
          const userId = dbUser?._id?.toString();
          const isOwner = ownerId && userId && ownerId === userId;

          if (fileKeys.length === 0 && isOwner) {
            const ext = project.language === 'javascript' ? 'js' : project.language === 'python' ? 'py' : 'txt';
            const defaultName = `main.${ext}`;
            filesMap.set(defaultName, { type: 'file' });
            setActiveFile(defaultName);
          } else {
            updateFilesList();
          }
        }
      } catch (err) {
        console.warn('[CodeSphere] Sync handler error:', err.message);
      }
    });

    return () => {
      if (bindEditorTimeout.current) clearTimeout(bindEditorTimeout.current);
      if (bindingRef.current) bindingRef.current.destroy();
      provider.disconnect();
      doc.destroy();
    };
  }, [project, roomId, dbUser]);

  const bindEditorTimeout = useRef(null);

  const bindEditor = () => {
    if (!editorRef.current || !docRef.current || !providerRef.current) return;

    const model = editorRef.current.getModel();
    if (!model || model.isDisposed()) return;
    
    // Extract filename from model.uri.path (e.g. "/main.js" -> "main.js")
    let filename = model.uri.path;
    if (filename.startsWith('/')) filename = filename.substring(1);
    
    if (!filename || filename === 'default') return;

    // Debounce rapid re-binds (e.g. when remote updates arrive during file switch)
    if (bindEditorTimeout.current) clearTimeout(bindEditorTimeout.current);
    bindEditorTimeout.current = setTimeout(() => {
      try {
        if (bindingRef.current) {
          bindingRef.current.destroy();
          bindingRef.current = null;
        }
        if (model.isDisposed()) return;
        
        const type = docRef.current.getText(filename);
        bindingRef.current = new MonacoBinding(
          type,
          model,
          new Set([editorRef.current]),
          providerRef.current.awareness
        );
      } catch (err) {
        console.warn('[CodeSphere] MonacoBinding error (harmless during sync):', err.message);
      }
    }, 50);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    bindEditor();

    editor.onDidChangeModel(() => {
      bindEditor();
    });
  };

  const handleDeleteItem = (path) => {
    if (!docRef.current) return;
    const filesMap = docRef.current.getMap('files');
    
    const keysToDelete = Array.from(filesMap.keys()).filter(k => k === path || k.startsWith(path + '/'));
    keysToDelete.forEach(k => filesMap.delete(k));

    if (activeFile === path || activeFile.startsWith(path + '/')) {
      const remaining = Array.from(filesMap.keys()).filter(k => !keysToDelete.includes(k));
      setActiveFile(remaining.length > 0 ? remaining[0] : '');
    }
  };

  const getActiveDir = () => {
    if (!activeFile) return '';
    if (docRef.current?.getMap('files')?.get(activeFile)?.type === 'folder') {
      return activeFile + '/';
    }
    const parts = activeFile.split('/');
    parts.pop();
    return parts.length ? parts.join('/') + '/' : '';
  };

  const createNewFile = () => {
    setNewItem({ type: 'file', dir: getActiveDir() });
  };

  const createNewFolder = () => {
    setNewItem({ type: 'folder', dir: getActiveDir() });
  };

  const handleCreateItem = (name, type, dir) => {
    if (!name) {
      setNewItem(null);
      return;
    }
    const path = dir + name;
    if (docRef.current) {
      const filesMap = docRef.current.getMap('files');
      if (!filesMap.has(path)) {
        filesMap.set(path, { type: type });
        if (type === 'file') {
          docRef.current.getText(path).insert(0, '');
          setActiveFile(path);
        }
      }
    }
    setNewItem(null);
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !docRef.current) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      const filesMap = docRef.current.getMap('files');
      filesMap.set(file.name, { type: 'file' });
      
      const textType = docRef.current.getText(file.name);
      textType.delete(0, textType.length);
      textType.insert(0, content);
      
      setActiveFile(file.name);
    };
    reader.readAsText(file);
  };

  const handleFolderUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (!docRef.current) return;
    
    const filesMap = docRef.current.getMap('files');
    let firstFile = null;

    uploadedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target.result;
        const filePath = file.webkitRelativePath || file.name;
        filesMap.set(filePath, { type: 'file' });
        
        const textType = docRef.current.getText(filePath);
        textType.delete(0, textType.length);
        textType.insert(0, content);
        
        if (!firstFile) {
          firstFile = filePath;
          setActiveFile(filePath);
        }
      };
      reader.readAsText(file);
    });
  };

  const runCode = async () => {
    if (!activeFile) return;
    setIsTerminalOpen(true);
    setIsRunning(true);

    const code = docRef.current?.getText(activeFile).toString() || '';
    const ext = activeFile.split('.').pop();
    let lang = 'javascript';
    let version = '18.15.0';
    
    if (ext === 'py') {
      lang = 'python';
      version = '3.10.0';
    } else if (ext === 'cpp' || ext === 'c') {
      lang = 'cpp';
      version = '10.2.0';
    }

    try {
      // Small delay to ensure xterm is initialized if terminal was just opened
      setTimeout(async () => {
        xtermRef.current?.write('\r\n\x1b[32m$ Executing script locally...\x1b[0m\r\n');
        
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/api/run`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            language: lang,
            code: code
          })
        });
        
        const data = await parseJsonResponse(res);
        if (res.ok) {
          const output = data.output || '\r\n(No output)';
          xtermRef.current?.write(output.replace(/\n/g, '\r\n') + '\r\n');
        } else {
          xtermRef.current?.write(`\r\n\x1b[31mError: ${data.error || 'Failed to execute code'}\x1b[0m\r\n`);
        }
        setIsRunning(false);
      }, 100);
    } catch (err) {
      xtermRef.current?.write(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`);
      setIsRunning(false);
    }
  };

  const getLanguageFromExtension = (filename) => {
    if (!filename) return 'plaintext';
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'py': 'python', 'html': 'html', 'css': 'css', 'json': 'json', 'md': 'markdown',
      'c': 'c', 'cpp': 'cpp', 'java': 'java', 'go': 'go', 'rs': 'rust',
      'sh': 'shell', 'bash': 'shell', 'yml': 'yaml', 'yaml': 'yaml'
    };
    return map[ext] || 'plaintext';
  };

  const getEditorValue = () => {
    return editorRef.current?.getValue() || '';
  };

  const setEditorValue = (newContent) => {
    if (!activeFile || !docRef.current) return;
    const ytext = docRef.current.getText(activeFile);
    ytext.delete(0, ytext.length);
    ytext.insert(0, newContent);
  };

  const setMultipleFiles = (filesArray) => {
    if (!docRef.current) return;
    const filesMap = docRef.current.getMap('files');
    filesArray.forEach(file => {
      if (!filesMap.has(file.path)) {
        filesMap.set(file.path, { type: 'file' });
      }
      const ytext = docRef.current.getText(file.path);
      ytext.delete(0, ytext.length);
      ytext.insert(0, file.content);
    });
  };

  const [activeLeftPanel, setActiveLeftPanel] = useState('explorer');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (error) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', padding: '2rem', maxWidth: '400px' }}>
        <div style={{ color: 'var(--danger)', fontSize: '2rem' }}>⚠️</div>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Failed to Load Room</h3>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{error}</span>
        <Link to="/dashboard" style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: 'var(--accent)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  if (!project) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Loading CodeSphere Room...</span>
      </div>
    </div>
  );

  const filteredFiles = files.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AppShell
      projectName={project?.name || 'CodeSphere Room'}
      activeLeftPanel={activeLeftPanel}
      onLeftPanelChange={setActiveLeftPanel}
      connectionStatus={syncState === 'synced' ? 'connected' : syncState === 'connecting' ? 'reconnecting' : 'offline'}
      leftPanel={(panelId) => (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-surface)' }}>
          {/* Panel Header */}
          <div style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, minWidth: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '0.5rem' }}>
              {panelId === 'explorer' && 'Project Explorer'}
              {panelId === 'search' && 'Search Files'}
              {panelId === 'source' && 'Source Control (GitHub)'}
              {panelId === 'ai' && 'AI Code Assistant'}
              {panelId === 'chat' && 'Room Chat'}
              {panelId === 'participants' && 'Collaborators'}
              {panelId === 'settings' && 'Room Settings'}
            </span>
            <button 
              onClick={() => setActiveLeftPanel(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '4px' }}
              title="Close Sidebar"
            >
              <X size={14} />
            </button>
          </div>

          {/* Explorer Panel */}
          {panelId === 'explorer' && (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.4rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>FILES</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="icon-btn" style={{ padding: '0.25rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }} onClick={createNewFile} title="New File"><FilePlus size={14} /></button>
                  <button className="icon-btn" style={{ padding: '0.25rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }} onClick={createNewFolder} title="New Folder"><FolderPlus size={14} /></button>
                  <button className="icon-btn" style={{ padding: '0.25rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }} onClick={() => folderInputRef.current?.click()} title="Open Folder"><FolderOpen size={14} /></button>
                  <button className="icon-btn" style={{ padding: '0.25rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '4px' }} onClick={() => fileInputRef.current?.click()} title="Upload File"><Upload size={14} /></button>
                </div>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                <input type="file" webkitdirectory="" directory="" ref={folderInputRef} style={{ display: 'none' }} onChange={handleFolderUpload} />
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '0.35rem' }}>
                <FileTree 
                  filesMapKeys={files} 
                  filesMap={docRef.current ? docRef.current.getMap('files') : null}
                  activeFile={activeFile}
                  setActiveFile={setActiveFile}
                  newItem={newItem}
                  setNewItem={setNewItem}
                  handleCreateItem={handleCreateItem}
                  handleDeleteItem={handleDeleteItem}
                />
              </div>
            </div>
          )}

          {/* Search Panel */}
          {panelId === 'search' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files in project..." 
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2rem',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                  {filteredFiles.length} {filteredFiles.length === 1 ? 'FILE' : 'FILES'} FOUND
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredFiles.map(filePath => (
                    <button
                      key={filePath}
                      onClick={() => setActiveFile(filePath)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.6rem',
                        background: activeFile === filePath ? 'var(--bg-active)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: activeFile === filePath ? 'var(--text-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '13px',
                        width: '100%'
                      }}
                    >
                      <FileCode size={14} style={{ flexShrink: 0, color: 'var(--accent)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filePath}</span>
                    </button>
                  ))}
                  {filteredFiles.length === 0 && (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', padding: '1rem 0', textAlign: 'center' }}>
                      No matching files
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* GitHub / Source Control */}
          {panelId === 'source' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '0.65rem' }}>
              <GitHubPanel getEditorValue={getEditorValue} setEditorValue={setEditorValue} setMultipleFiles={setMultipleFiles} activeFile={activeFile} />
            </div>
          )}

          {/* AI Panel */}
          {panelId === 'ai' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '0.65rem' }}>
              <AIPanel getEditorValue={getEditorValue} language={project.language} />
            </div>
          )}

          {/* Chat Panel */}
          {panelId === 'chat' && (
            <div style={{ flex: 1, overflow: 'hidden', padding: '0.5rem' }}>
              <ChatPanel roomId={roomId} />
            </div>
          )}

          {/* Participants Panel */}
          {panelId === 'participants' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '0.65rem' }}>
              <PeoplePanel roomId={roomId} project={project} setProject={setProject} />
            </div>
          )}

          {/* Settings Panel */}
          {panelId === 'settings' && (
            <div style={{ flex: 1, overflow: 'auto', padding: '0.65rem' }}>
              <SettingsPanel roomId={roomId} project={project} />
            </div>
          )}
        </div>
      )}
      rightPanel={
        isRightPanelOpen ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)', overflow: 'hidden' }}>
            {/* Right Tabs Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-subtle)', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
                <button 
                  onClick={() => setActiveTab('chat')} 
                  style={{ padding: '0.4rem 0.6rem', border: 'none', background: activeTab === 'chat' ? 'var(--bg-elevated)' : 'transparent', borderRadius: 'var(--radius-sm)', color: activeTab === 'chat' ? 'var(--accent)' : 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  title="Chat"
                >
                  <MessageSquare size={14} /> <span>Chat</span>
                </button>
                <button 
                  onClick={() => setActiveTab('call')} 
                  style={{ padding: '0.4rem 0.6rem', border: 'none', background: activeTab === 'call' ? 'var(--bg-elevated)' : 'transparent', borderRadius: 'var(--radius-sm)', color: activeTab === 'call' ? 'var(--accent)' : 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  title="Video & Audio Call"
                >
                  <Video size={14} /> <span>Call</span>
                </button>
                <button 
                  onClick={() => setActiveTab('ai')} 
                  style={{ padding: '0.4rem 0.6rem', border: 'none', background: activeTab === 'ai' ? 'var(--bg-elevated)' : 'transparent', borderRadius: 'var(--radius-sm)', color: activeTab === 'ai' ? 'var(--accent)' : 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  title="AI Assistant"
                >
                  <Cpu size={14} /> <span>AI</span>
                </button>
                <button 
                  onClick={() => setActiveTab('github')} 
                  style={{ padding: '0.4rem 0.6rem', border: 'none', background: activeTab === 'github' ? 'var(--bg-elevated)' : 'transparent', borderRadius: 'var(--radius-sm)', color: activeTab === 'github' ? 'var(--accent)' : 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  title="GitHub"
                >
                  <GitBranch size={14} /> <span>Git</span>
                </button>
                <button 
                  onClick={() => setActiveTab('people')} 
                  style={{ padding: '0.4rem 0.6rem', border: 'none', background: activeTab === 'people' ? 'var(--bg-elevated)' : 'transparent', borderRadius: 'var(--radius-sm)', color: activeTab === 'people' ? 'var(--accent)' : 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                  title="People"
                >
                  <Users size={14} />
                </button>
              </div>
              <button 
                onClick={() => setIsRightPanelOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                title="Hide Right Panel"
              >
                <X size={14} />
              </button>
            </div>
            {/* Right Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'chat' && <ChatPanel roomId={roomId} />}
              {activeTab === 'call' && <CallPanel roomId={roomId} />}
              {activeTab === 'ai' && <AIPanel getEditorValue={getEditorValue} language={project.language} />}
              {activeTab === 'github' && <GitHubPanel getEditorValue={getEditorValue} setEditorValue={setEditorValue} setMultipleFiles={setMultipleFiles} activeFile={activeFile} />}
              {activeTab === 'people' && <PeoplePanel roomId={roomId} project={project} setProject={setProject} />}
              {activeTab === 'settings' && <SettingsPanel roomId={roomId} project={project} />}
            </div>
          </div>
        ) : null
      }
      bottomPanel={
        isTerminalOpen ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TerminalSquare size={13} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>INTEGRATED TERMINAL</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => setIsTerminalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px', borderRadius: '4px' }} title="Close Terminal">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div ref={terminalRef} style={{ flex: 1, padding: '4px', overflow: 'hidden' }} />
          </div>
        ) : null
      }
    >
      {/* Editor Header Bar */}
      <div style={{ height: '38px', backgroundColor: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>
          <FileCode size={15} style={{ color: 'var(--accent)' }} />
          <span>{activeFile || 'Select a file from Explorer'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '0.3rem 0.65rem', 
              backgroundColor: isRunning ? 'var(--bg-elevated)' : 'rgba(34, 197, 94, 0.15)', 
              color: isRunning ? 'var(--text-tertiary)' : '#4ade80', 
              border: '1px solid rgba(34, 197, 94, 0.3)', 
              borderRadius: 'var(--radius-sm)', 
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }} 
            onClick={runCode} 
            disabled={isRunning} 
            title="Run Code (Ctrl+Enter)"
          >
            <Play size={13} fill="#4ade80" />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <button 
            style={{ 
              padding: '0.35rem 0.55rem', 
              background: isTerminalOpen ? 'var(--bg-elevated)' : 'none', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-sm)', 
              color: isTerminalOpen ? 'var(--accent)' : 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px'
            }} 
            onClick={() => setIsTerminalOpen(!isTerminalOpen)} 
            title="Toggle Integrated Terminal"
          >
            <TerminalSquare size={14} />
            <span>Terminal</span>
          </button>

          <button 
            style={{ 
              padding: '0.35rem 0.55rem', 
              background: isRightPanelOpen ? 'var(--bg-elevated)' : 'none', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-sm)', 
              color: isRightPanelOpen ? 'var(--accent)' : 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px'
            }} 
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)} 
            title="Toggle Right Side Dock"
          >
            <Users size={14} />
            <span>Dock</span>
          </button>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Editor
          path={activeFile || 'default'}
          height="100%"
          language={getLanguageFromExtension(activeFile)}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true, maxColumn: 80 },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Menlo', 'Monaco', monospace",
            padding: { top: 12 },
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true
          }}
        />
      </div>
    </AppShell>
  );
};

const TabButton = ({ active, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`room-tab-btn ${active ? 'active' : ''}`}
  >
    {React.cloneElement(icon, { size: 20 })}
  </button>
);

export default Room;

const FileTree = ({ filesMapKeys, filesMap, activeFile, setActiveFile, newItem, setNewItem, handleCreateItem, handleDeleteItem }) => {
  if (!filesMap) return null;

  // Build tree
  const tree = {};
  
  filesMapKeys.forEach(path => {
    const parts = path.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          isFolder: i < parts.length - 1 || filesMap.get(path)?.type === 'folder',
          children: {}
        };
      }
      current = current[part].children;
    }
  });

  if (newItem) {
    const parts = newItem.dir.split('/').filter(Boolean);
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = { name: part, path: parts.slice(0, i + 1).join('/'), isFolder: true, children: {} };
      }
      current = current[part].children;
    }
    current['__NEW_ITEM__'] = {
      isInput: true,
      type: newItem.type,
      dir: newItem.dir,
      path: newItem.dir + '__NEW_ITEM__'
    };
  }

  return (
    <div style={{ paddingTop: '0.5rem' }}>
      {Object.values(tree)
        .sort((a, b) => {
          if (a.isInput) return -1;
          if (b.isInput) return 1;
          return (b.isFolder === a.isFolder ? a.name.localeCompare(b.name) : b.isFolder ? 1 : -1)
        })
        .map(node => (
          <FileNode key={node.path} node={node} depth={0} activeFile={activeFile} setActiveFile={setActiveFile} setNewItem={setNewItem} handleCreateItem={handleCreateItem} handleDeleteItem={handleDeleteItem} />
      ))}
    </div>
  );
};

const FileNode = ({ node, depth, activeFile, setActiveFile, setNewItem, handleCreateItem, handleDeleteItem }) => {
  const [expanded, setExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  if (node.isInput) {
    return (
      <div 
        className="vscode-file" 
        style={{ paddingLeft: `${depth * 1 + 0.5}rem`, display: 'flex', alignItems: 'center' }}
      >
        <span className="file-icon" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{width:'18px'}}></span>
          {node.type === 'folder' ? <Folder size={14} color="#60a5fa" /> : <FileText size={14} color="#a1a1aa" />}
        </span>
        <input 
          autoFocus
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleCreateItem(inputValue, node.type, node.dir);
            if (e.key === 'Escape') setNewItem(null);
          }}
          onBlur={() => {
            if (inputValue) handleCreateItem(inputValue, node.type, node.dir);
            else setNewItem(null);
          }}
          style={{ 
            background: '#1e1e1e', color: '#d4d4d8', border: '1px solid #3f3f46', 
            outline: 'none', marginLeft: '0.25rem', width: '90%', fontSize: '0.85rem' 
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div 
        className={`vscode-file ${activeFile === node.path && !node.isFolder ? 'active' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexDirection: 'row',
          paddingLeft: `${depth * 0.75 + 0.5}rem`,
          paddingRight: '0.5rem',
          paddingTop: '0.25rem',
          paddingBottom: '0.25rem',
          cursor: 'pointer',
          borderRadius: '4px',
          userSelect: 'none'
        }}
        onClick={() => {
          if (node.isFolder) setExpanded(!expanded);
          else setActiveFile(node.path);
        }}
        title={node.path}
      >
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
          <span className="file-icon" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {node.isFolder ? (
              expanded ? <ChevronDown size={14} style={{marginRight:'4px'}}/> : <ChevronRight size={14} style={{marginRight:'4px'}}/>
            ) : (
              <span style={{width:'18px'}}></span>
            )}
            {node.isFolder ? <Folder size={14} color="#60a5fa" /> : <FileText size={14} color="#a1a1aa" />}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '0.4rem', fontSize: '0.85rem' }}>
            {node.name}
          </span>
        </div>
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete ${node.name}?`)) {
                handleDeleteItem(node.path);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '3px'
            }}
            title={`Delete ${node.isFolder ? 'folder' : 'file'}`}
          >
            <Trash2 size={12} style={{ color: 'var(--danger)' }} />
          </button>
        )}
      </div>
      {node.isFolder && expanded && (
        <div>
          {Object.values(node.children)
            .sort((a, b) => {
              if (a.isInput) return -1;
              if (b.isInput) return 1;
              return (b.isFolder === a.isFolder ? a.name.localeCompare(b.name) : b.isFolder ? 1 : -1)
            })
            .map(child => (
              <FileNode key={child.path} node={child} depth={depth + 1} activeFile={activeFile} setActiveFile={setActiveFile} setNewItem={setNewItem} handleCreateItem={handleCreateItem} handleDeleteItem={handleDeleteItem} />
          ))}
        </div>
      )}
    </div>
  );
};

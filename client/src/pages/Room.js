import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from '../y-monaco.js';
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, MessageSquare, Video, Cpu, GitBranch, Users, FileCode, Search, Settings, FileText, Upload, FilePlus, FolderPlus, FolderOpen, Folder, ChevronRight, ChevronDown, Play, TerminalSquare, X, Copy } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import ChatPanel from '../components/panels/ChatPanel';
import CallPanel from '../components/panels/CallPanel';
import AIPanel from '../components/panels/AIPanel';
import GitHubPanel from '../components/panels/GitHubPanel';
import PeoplePanel from '../components/panels/PeoplePanel';
import SettingsPanel from '../components/panels/SettingsPanel';

const Room = () => {
  const { id: roomId } = useParams();
  const { currentUser, dbUser, getToken } = useAuth();
  const [project, setProject] = useState(null);
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

      const ws = new WebSocket('ws://localhost:5000/shell');
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
        const token = getToken();
        const res = await fetch(`http://localhost:5000/api/projects/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (error) {
        console.error("Failed to fetch project", error);
      }
    };
    if (currentUser) fetchProject();
  }, [roomId, currentUser]);

  useEffect(() => {
    if (!project) return;

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:5000/yjs',
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
      const fileKeys = Array.from(filesMap.keys());
      setFiles([...fileKeys]);
      
      // If we don't have an active file yet, pick the first one
      if (fileKeys.length > 0) {
        setActiveFile(prev => prev ? prev : fileKeys[0]);
      }
    };

    filesMap.observe(updateFilesList);

    provider.on('sync', (isSynced) => {
      if (isSynced) {
        const fileKeys = Array.from(filesMap.keys());
        if (fileKeys.length === 0) {
          // Initialize default file if room is totally empty
          const ext = project.language === 'javascript' ? 'js' : project.language === 'python' ? 'py' : 'txt';
          const defaultName = `main.${ext}`;
          filesMap.set(defaultName, { type: 'file' });
          setActiveFile(defaultName);
        } else {
          updateFilesList();
        }
      }
    });

    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
      provider.disconnect();
      doc.destroy();
    };
  }, [project, roomId, dbUser]);

  // Bind Editor whenever activeFile changes
  useEffect(() => {
    if (!activeFile || !editorRef.current || !docRef.current || !providerRef.current) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    const type = docRef.current.getText(activeFile);
    bindingRef.current = new MonacoBinding(
      type, 
      editorRef.current.getModel(), 
      new Set([editorRef.current]), 
      providerRef.current.awareness
    );

  }, [activeFile]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // Force re-evaluation of binding effect
    setActiveFile(prev => {
      const temp = prev;
      return temp;
    });
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
        const res = await fetch('http://localhost:5000/api/run', {
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
        
        if (res.ok) {
          const data = await res.json();
          const output = data.output || '\r\n(No output)';
          xtermRef.current?.write(output.replace(/\n/g, '\r\n') + '\r\n');
        } else {
          const data = await res.json();
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
        filesMap.set(file.path, file.path);
      }
      const ytext = docRef.current.getText(file.path);
      ytext.delete(0, ytext.length);
      ytext.insert(0, file.content);
    });
  };

  if (!project) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="room-layout">
      {/* Top Bar */}
      <header className="page-header" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/dashboard" className="icon-btn">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="page-header-title">{project.name}</h1>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="room-workspace">
        {/* Activity Bar */}
        <div className="vscode-activity-bar">
          <div className="activity-bar-top">
            <button className="activity-btn active" title="Explorer"><FileCode size={24} /></button>
            <button className="activity-btn" title="Search"><Search size={24} /></button>
            <button className="activity-btn" title="Source Control"><GitBranch size={24} /></button>
          </div>
          <div className="activity-bar-bottom">
            <button className="activity-btn" title="Settings"><Settings size={24} /></button>
          </div>
        </div>

        {/* File Explorer */}
        <div className="vscode-sidebar">
          <div className="vscode-sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>EXPLORER</span>
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <button className="icon-btn" style={{ padding: '0.2rem', color: '#a1a1aa' }} onClick={createNewFile} title="New File">
                <FilePlus size={14} />
              </button>
              <button className="icon-btn" style={{ padding: '0.2rem', color: '#a1a1aa' }} onClick={createNewFolder} title="New Folder">
                <FolderPlus size={14} />
              </button>
              <button className="icon-btn" style={{ padding: '0.2rem', color: '#a1a1aa' }} onClick={() => folderInputRef.current?.click()} title="Open Folder">
                <FolderOpen size={14} />
              </button>
              <button className="icon-btn" style={{ padding: '0.2rem', color: '#a1a1aa' }} onClick={() => fileInputRef.current?.click()} title="Upload File">
                <Upload size={14} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <input type="file" webkitdirectory="" directory="" ref={folderInputRef} style={{ display: 'none' }} onChange={handleFolderUpload} />
          </div>
          <div className="vscode-sidebar-content">
            <FileTree 
              filesMapKeys={files} 
              filesMap={docRef.current ? docRef.current.getMap('files') : null}
              activeFile={activeFile}
              setActiveFile={setActiveFile}
              newItem={newItem}
              setNewItem={setNewItem}
              handleCreateItem={handleCreateItem}
            />
          </div>
        </div>

        {/* Editor Area */}
        <div className="room-editor-container" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Editor Header */}
          <div style={{ height: '35px', backgroundColor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', fontSize: '0.85rem' }}>
              <FileText size={14} />
              {activeFile}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="icon-btn" style={{ padding: '0.2rem', color: isRunning ? '#a1a1aa' : '#22c55e' }} onClick={runCode} disabled={isRunning} title="Run Code">
                <Play size={16} />
              </button>
              <button className="icon-btn" style={{ padding: '0.2rem', color: '#a1a1aa' }} onClick={() => setIsTerminalOpen(!isTerminalOpen)} title="Toggle Terminal">
                <TerminalSquare size={16} />
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language={getLanguageFromExtension(activeFile)}
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 10 }
              }}
            />
          </div>

          {/* Terminal / Output Panel */}
          {isTerminalOpen && (
            <div style={{ height: `${terminalHeight}%`, backgroundColor: '#18181b', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              {/* Resize Handle */}
              <div 
                onMouseDown={startResize}
                style={{ 
                  height: '4px', 
                  backgroundColor: 'var(--border-color)', 
                  cursor: 'row-resize',
                  position: 'absolute',
                  top: '-2px',
                  left: 0,
                  right: 0,
                  zIndex: 10,
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'var(--border-color)'}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#1e1e1e' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase' }}>Terminal & Output</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="icon-btn" 
                    style={{ padding: '0.2rem', color: '#a1a1aa' }} 
                    title="Copy Terminal Output"
                    onClick={() => {
                      if (!xtermRef.current) return;
                      let text = '';
                      // Get selected text if any, otherwise get all text
                      if (xtermRef.current.hasSelection()) {
                        text = xtermRef.current.getSelection();
                      } else {
                        const buffer = xtermRef.current.buffer.active;
                        for (let i = 0; i < buffer.length; i++) {
                          text += buffer.getLine(i)?.translateToString(true) + '\n';
                        }
                      }
                      navigator.clipboard.writeText(text.trim());
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <button className="icon-btn" style={{ padding: '0.2rem', color: '#a1a1aa' }} onClick={() => setIsTerminalOpen(false)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
              
              {/* xterm.js container */}
              <div ref={terminalRef} style={{ flex: 1, overflow: 'hidden', padding: '0.5rem', backgroundColor: '#18181b' }} />
              
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="room-sidebar">
          {/* Tabs */}
          <div className="room-tab-bar">
            <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare />} />
            <TabButton active={activeTab === 'call'} onClick={() => setActiveTab('call')} icon={<Video />} />
            <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Cpu />} />
            <TabButton active={activeTab === 'github'} onClick={() => setActiveTab('github')} icon={<GitBranch />} />
            <TabButton active={activeTab === 'people'} onClick={() => setActiveTab('people')} icon={<Users />} />
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} />
          </div>

          {/* Panel Content */}
          <div className="room-panel-content">
            {activeTab === 'chat' && <ChatPanel roomId={roomId} />}
            {activeTab === 'call' && <CallPanel roomId={roomId} />}
            {activeTab === 'ai' && <AIPanel getEditorValue={getEditorValue} language={project.language} />}
            {activeTab === 'github' && <GitHubPanel getEditorValue={getEditorValue} setEditorValue={setEditorValue} setMultipleFiles={setMultipleFiles} activeFile={activeFile} />}
            {activeTab === 'people' && <PeoplePanel roomId={roomId} project={project} setProject={setProject} />}
            {activeTab === 'settings' && <SettingsPanel roomId={roomId} project={project} />}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <footer className="vscode-status-bar">
        <div className="status-bar-section">
          <span>{project.name}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <GitBranch size={12} /> main
          </span>
        </div>
        <div className="status-bar-section">
          <span>{syncState === 'synced' ? 'Live sync' : 'Connecting...'}</span>
          <span style={{ textTransform: 'uppercase' }}>{project.language}</span>
          <span>Prettier</span>
        </div>
      </footer>
    </div>
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

const FileTree = ({ filesMapKeys, filesMap, activeFile, setActiveFile, newItem, setNewItem, handleCreateItem }) => {
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
          <FileNode key={node.path} node={node} depth={0} activeFile={activeFile} setActiveFile={setActiveFile} setNewItem={setNewItem} handleCreateItem={handleCreateItem} />
      ))}
    </div>
  );
};

const FileNode = ({ node, depth, activeFile, setActiveFile, setNewItem, handleCreateItem }) => {
  const [expanded, setExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');

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
        style={{ paddingLeft: `${depth * 1 + 0.5}rem` }}
        onClick={() => {
          if (node.isFolder) setExpanded(!expanded);
          else setActiveFile(node.path);
        }}
        title={node.path}
      >
        <span className="file-icon" style={{ display: 'flex', alignItems: 'center' }}>
          {node.isFolder ? (
            expanded ? <ChevronDown size={14} style={{marginRight:'4px'}}/> : <ChevronRight size={14} style={{marginRight:'4px'}}/>
          ) : (
            <span style={{width:'18px'}}></span> // placeholder for indent
          )}
          {node.isFolder ? <Folder size={14} color="#60a5fa" /> : <FileText size={14} color="#a1a1aa" />}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '0.25rem' }}>
          {node.name}
        </span>
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
              <FileNode key={child.path} node={child} depth={depth + 1} activeFile={activeFile} setActiveFile={setActiveFile} setNewItem={setNewItem} handleCreateItem={handleCreateItem} />
          ))}
        </div>
      )}
    </div>
  );
};

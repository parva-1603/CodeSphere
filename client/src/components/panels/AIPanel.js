import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Bot, Copy, Check, TerminalSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import './ChatPanel.css'; // Reusing the same threaded styles
import { API_BASE_URL } from '../../config/api';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Copy failed:', err);
      });
  };

  return (
    <button 
      onClick={handleCopy} 
      className="icon-btn" 
      style={{ position: 'absolute', top: '0', right: '0', padding: '0.2rem', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }} 
      title="Copy"
    >
      {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} color="var(--text-tertiary)" />}
    </button>
  );
};

const AIPanel = ({ getEditorValue, language }) => {
  const { currentUser, getToken } = useAuth();
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hi! I'm your AI pair programmer. I can see your code. How can I help?", timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date().toISOString() }]);
    setInput('');
    setLoading(true);

    try {
      const codeContext = getEditorValue();
      const token = getToken();
      
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg, codeContext, language })
      });
      
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply || 'No response', timestamp: new Date().toISOString() }]);
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${errData.error || 'Request failed'}`, timestamp: new Date().toISOString() }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error.", timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="panel-thread-container">
      <div className="panel-thread-header">
        <h3 className="panel-title">AI Assistant</h3>
      </div>
      <div className="thread-messages">
        {messages.map((m, i) => (
          <motion.div 
            key={i} 
            className="thread-message"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <div className="thread-message-avatar" style={{ backgroundColor: m.sender === 'ai' ? 'var(--accent)' : 'var(--bg-active)', color: m.sender === 'ai' ? '#fff' : 'var(--text-primary)' }}>
              {m.sender === 'ai' ? <Bot size={14} /> : 'U'}
            </div>
            <div className="thread-message-content" style={{ position: 'relative' }}>
              <div className="thread-message-header">
                <span className="thread-message-author">{m.sender === 'ai' ? 'CodeSphere AI' : 'You'}</span>
                <span className="thread-message-time">{formatTime(m.timestamp)}</span>
              </div>
              <div className="thread-message-body ai-markdown" style={{ paddingRight: m.sender === 'ai' ? '24px' : '0' }}>
                {m.sender === 'ai' ? (
                  <>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                    <CopyButton text={m.text} />
                  </>
                ) : (
                  m.text
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div 
            className="thread-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <div className="thread-message-avatar" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
              <Bot size={14} />
            </div>
            <div className="thread-message-content">
              <div className="thread-message-header">
                <span className="thread-message-author">CodeSphere AI</span>
              </div>
              <div className="thread-message-body">
                <span className="animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>
      <div className="thread-input-area">
        <form onSubmit={sendMessage} className="thread-input-form">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI about your code..." 
            className="thread-input-field"
            disabled={loading}
          />
          <button type="submit" className="thread-submit-btn" disabled={!input.trim() || loading}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIPanel;

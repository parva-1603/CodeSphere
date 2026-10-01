import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Bot, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Copy failed: Document not focused or permission denied.', err);
      });
  };

  return (
    <button 
      onClick={handleCopy} 
      className="icon-btn" 
      style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', padding: '0.2rem', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '4px' }} 
      title="Copy"
    >
      {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} color="#a1a1aa" />}
    </button>
  );
};

const AIPanel = ({ getEditorValue, language }) => {
  const { currentUser, getToken } = useAuth();
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hi! I'm your AI pair programmer. I can see your code. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const codeContext = getEditorValue();
      const token = getToken();
      
      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg, codeContext, language })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        const errData = await res.json();
        setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${errData.error || 'Request failed'}` }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel-content">
      <div className="ai-messages">
        {messages.map((m, i) => (
          <div key={i} className={`ai-message ${m.sender === 'user' ? 'user' : 'bot'}`} style={{ flexDirection: m.sender === 'user' ? 'row-reverse' : 'row' }}>
            {m.sender === 'ai' && (
              <div className="ai-avatar bot">
                <Bot size={18} />
              </div>
            )}
            <div className={`ai-bubble ${m.sender === 'user' ? 'sent' : 'received'}`} style={{ backgroundColor: m.sender === 'user' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)', position: 'relative', paddingRight: m.sender === 'ai' ? '2.5rem' : '1rem' }}>
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
        ))}
        {loading && (
          <div className="ai-message">
             <div className="ai-avatar bot">
                <Bot size={18} />
              </div>
              <div className="ai-bubble received" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span className="animate-pulse">Thinking...</span>
              </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={sendMessage} className="chat-input-form">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI about your code..." 
          className="chat-input"
        />
        <button type="submit" disabled={loading} className="chat-send-btn" style={{ opacity: loading ? 0.5 : 1 }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default AIPanel;

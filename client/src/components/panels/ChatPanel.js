import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import './ChatPanel.css';

const ChatPanel = ({ roomId }) => {
  const socket = useSocket();
  const { dbUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    
    socket.emit('join-room', { roomId, user: dbUser });

    socket.on('receive-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-joined', ({ user }) => {
      setMessages(prev => [...prev, { system: true, text: `${user?.displayName || 'Someone'} joined.` }]);
    });

    socket.on('user-left', ({ user }) => {
      setMessages(prev => [...prev, { system: true, text: `${user?.displayName || 'Someone'} left.` }]);
    });

    return () => {
      socket.off('receive-message');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket, roomId, dbUser]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    
    const msg = {
      text: input,
      sender: dbUser?.displayName || 'User',
      timestamp: new Date().toISOString()
    };
    
    socket.emit('send-message', { roomId, message: msg });
    setInput('');
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="panel-thread-container">
      <div className="panel-thread-header">
        <h3 className="panel-title">Chat</h3>
      </div>
      <div className="thread-messages">
        {messages.map((m, i) => {
          if (m.system) {
            return (
              <motion.div 
                key={i} 
                className="thread-system-msg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <span className="thread-system-dot" />
                {m.text}
              </motion.div>
            );
          }
          return (
            <motion.div 
              key={i} 
              className="thread-message"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <div className="thread-message-avatar">
                {m.sender.charAt(0).toUpperCase()}
              </div>
              <div className="thread-message-content">
                <div className="thread-message-header">
                  <span className="thread-message-author">{m.sender}</span>
                  <span className="thread-message-time">{formatTime(m.timestamp)}</span>
                </div>
                <div className="thread-message-body">
                  {m.text}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="thread-input-area">
        <form onSubmit={sendMessage} className="thread-input-form">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Reply..." 
            className="thread-input-field"
          />
          <button type="submit" className="thread-submit-btn" disabled={!input.trim()}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;

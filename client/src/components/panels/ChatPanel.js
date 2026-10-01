import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send } from 'lucide-react';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-messages">
        {messages.map((m, i) => (
          m.system ? (
            <div key={i} className="chat-system-msg">{m.text}</div>
          ) : (
            <div key={i} className={`chat-bubble-wrap ${m.sender === dbUser?.displayName ? 'sent' : 'received'}`}>
              <span className="chat-sender-name">{m.sender}</span>
              <div className={`chat-bubble ${m.sender === dbUser?.displayName ? 'sent' : 'received'}`}>
                {m.text}
              </div>
            </div>
          )
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={sendMessage} className="chat-input-form">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..." 
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;

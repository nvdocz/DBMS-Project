import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function InquiryChat() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [inquiry, setInquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChat();
    // In a real app we might poll this or use WebSockets. We will fetch on mount.
    const interval = setInterval(fetchChat, 5000); // lightweight auto-refresh logic
    return () => clearInterval(interval);
  }, [id]);

  const fetchChat = async () => {
    try {
      const resp = await axios.get(`/api/inquiries/${id}/messages`);
      setInquiry(resp.data.inquiry);
      setMessages(resp.data.messages);
      setLoading(false);
      // Mark all messages as read as soon as the chat is visible
      axios.post(`/api/inquiries/${id}/read`).catch(() => {});
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`/api/inquiries/${id}/messages`, { message: newMessage });
      setNewMessage('');
      fetchChat();
    } catch (err) {
      alert('Error sending message');
    }
  };

  const toggleStatus = async () => {
    const newStatus = inquiry.status === 'pending' ? 'completed' : 'pending';
    try {
      await axios.patch(`/api/inquiries/${id}/status`, { status: newStatus });
      fetchChat();
    } catch (err) {
      alert('Error updating status');
    }
  };

  if (loading) return <div className="container" style={{ padding: '8rem 2rem', textAlign: 'center' }}>Loading chat...</div>;

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* Header bar */}
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '8px 8px 0 0', border: '1px solid var(--color-surface-light)', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img src={inquiry.imageUrl} alt="Car" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{inquiry.make} {inquiry.model} ({inquiry.year})</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Client: <span style={{ color: 'var(--color-text-primary)' }}>{inquiry.client_name}</span> | 
              Status: <span style={{ color: inquiry.status === 'completed' ? '#00ff00' : 'var(--color-neon-red)', marginLeft: '0.5rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{inquiry.status}</span>
            </p>
          </div>
        </div>

        <div>
          {user.role !== 'client' && (
            <button onClick={toggleStatus} className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
              Mark as {inquiry.status === 'pending' ? 'Completed' : 'Pending'}
            </button>
          )}
        </div>
      </div>

      {/* Chat History */}
      <div style={{ background: 'var(--color-surface-light)', flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', borderLeft: '1px solid var(--color-surface)', borderRight: '1px solid var(--color-surface)' }}>
        {messages.map((m) => {
          const isMe = m.sender_id === user.id;
          return (
            <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.2rem', textAlign: isMe ? 'right' : 'left' }}>
                {m.sender_name} {m.sender_role !== 'client' && <span style={{ color: 'var(--color-neon-red)' }}>(Staff)</span>}
              </div>
              <div style={{ 
                background: isMe ? 'rgba(255, 42, 42, 0.2)' : 'var(--color-surface)', 
                border: isMe ? '1px solid var(--color-neon-red-glow)' : '1px solid #333',
                padding: '1rem', 
                borderRadius: '8px' 
              }}>
                {m.message}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.3rem', textAlign: isMe ? 'right' : 'left' }}>
                {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '0 0 8px 8px', border: '1px solid var(--color-surface-light)', borderTop: 'none', display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder={inquiry.status === 'completed' ? "This inquiry is completed." : "Type your message..."} 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          disabled={inquiry.status === 'completed'}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={inquiry.status === 'completed' || !newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default InquiryChat;

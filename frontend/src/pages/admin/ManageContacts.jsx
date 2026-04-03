import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageContacts() {
  const [contacts, setContacts] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/contacts');
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/contacts/${id}/read`);
      setContacts(prev => prev.map(c => c.id === id ? { ...c, is_read: 1 } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/contacts/${id}`);
      setContacts(prev => prev.filter(c => c.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (err) {
      alert('Error deleting: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => prev === id ? null : id);
    const contact = contacts.find(c => c.id === id);
    if (contact && !contact.is_read) markRead(id);
  };

  const unreadCount = contacts.filter(c => !c.is_read).length;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <h1 className="neon-text" style={{ fontSize: '2.5rem', margin: 0 }}>Contact Messages</h1>
        {unreadCount > 0 && (
          <span style={{
            background: 'var(--color-neon-red)', color: '#fff',
            borderRadius: '12px', padding: '0.2rem 0.7rem',
            fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'var(--font-body)',
            boxShadow: '0 0 8px var(--color-neon-red-glow)'
          }}>
            {unreadCount} new
          </span>
        )}
      </div>

      {contacts.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', padding: '2rem 0' }}>No contact messages yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {contacts.map(c => (
            <div
              key={c.id}
              style={{
                background: 'var(--color-surface)',
                border: `1px solid ${!c.is_read ? 'var(--color-neon-red)' : 'var(--color-surface-light)'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: !c.is_read ? '0 0 10px var(--color-neon-red-glow)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Row header */}
              <div
                onClick={() => toggleExpand(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.5rem', cursor: 'pointer',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  {/* Unread dot */}
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: !c.is_read ? 'var(--color-neon-red)' : 'transparent',
                    boxShadow: !c.is_read ? '0 0 6px var(--color-neon-red)' : 'none',
                  }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{c.name}</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginLeft: '0.75rem' }}>{c.email}</span>
                  </div>
                  <p style={{
                    color: 'var(--color-text-secondary)', fontSize: '0.85rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1, marginLeft: '1rem', display: expanded === c.id ? 'none' : 'block'
                  }}>
                    {c.message}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteContact(c.id); }}
                    className="btn"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--color-neon-red)', color: 'var(--color-neon-red)' }}
                  >
                    Delete
                  </button>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
                    {expanded === c.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded message body */}
              {expanded === c.id && (
                <div style={{
                  padding: '0 1.5rem 1.5rem 1.5rem',
                  borderTop: '1px solid var(--color-surface-light)',
                }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: '1rem 0 0.5rem' }}>Message</p>
                  <p style={{ color: 'var(--color-text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{c.message}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                    <a
                      href={`mailto:${c.email}?subject=Re: Your message to nv.drive`}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                    >
                      Reply via Email
                    </a>
                    <a
                      href={`https://wa.me/917012569996`}
                      className="btn"
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderColor: '#25D366', color: '#25D366' }}
                      target="_blank" rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManageContacts;

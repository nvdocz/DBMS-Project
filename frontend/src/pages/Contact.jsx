import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');
  const [contacts, setContacts] = useState([]);

  const fetchContacts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to load contacts', error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await axios.post('http://localhost:5000/api/contact', formData);
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      fetchContacts(); // refresh the table
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error("Contact error:", error);
      setStatus('error');
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem' }}>
      <h1 className="neon-text" style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
        Contact <span style={{color: 'var(--color-text-primary)'}}>nv.</span><span style={{color: 'var(--color-neon-red)'}}>drive</span>
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '4rem' }}>
        Have inquiries about a vehicle or need support? Reach out to our team.
      </p>

      <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap' }}>
        
        {/* Contact Form */}
        <div style={{ flex: '1 1 400px' }}>
          <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', padding: '2.5rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Send a Message</h2>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea required name="message" className="form-input" rows="5" value={formData.message} onChange={handleChange} placeholder="How can we help you?"></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
            
            {status === 'success' && <p style={{ color: '#00ff00', marginTop: '1rem', textAlign: 'center' }}>Message sent successfully!</p>}
            {status === 'error' && <p style={{ color: 'var(--color-neon-red)', marginTop: '1rem', textAlign: 'center' }}>Failed to send message.</p>}
          </form>
        </div>

        {/* Contact Table */}
        <div style={{ flex: '1 1 600px' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Recent Inquiries (Admin View)</h2>
          <div className="table-container">
            {contacts.length > 0 ? (
               <table className="neon-table">
               <thead>
                 <tr>
                   <th>Name</th>
                   <th>Email</th>
                   <th>Message</th>
                   <th>Date</th>
                 </tr>
               </thead>
               <tbody>
                 {contacts.map(c => (
                   <tr key={c.id}>
                     <td>{c.name}</td>
                     <td>{c.email}</td>
                     <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.message}</td>
                     <td>{new Date(c.created_at).toLocaleDateString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
            ) : (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No recent inquiries.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Contact;

import React, { useState } from 'react';
import axios from 'axios';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await axios.post('/api/contact', formData);
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Contact error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem' }}>
      <h1 className="neon-text" style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
        Contact <span style={{ color: 'var(--color-text-primary)' }}>nv.</span><span style={{ color: 'var(--color-neon-red)' }}>drive</span>
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
              <input required type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} placeholder="Your full name" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="your@email.com" />
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea required name="message" className="form-input" rows="5" value={formData.message} onChange={handleChange} placeholder="How can we help you?"></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'success' && (
              <p style={{ color: '#00ff00', marginTop: '1rem', textAlign: 'center' }}>
                ✓ Message sent successfully! We'll get back to you soon.
              </p>
            )}
            {status === 'error' && (
              <p style={{ color: 'var(--color-neon-red)', marginTop: '1rem', textAlign: 'center' }}>
                Failed to send message. Please try again.
              </p>
            )}
          </form>
        </div>

        {/* Direct Contact Info */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: 'var(--color-surface)', padding: '2.5rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Direct Contact</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
              For immediate assistance, you can call us directly:
            </p>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              <a href="tel:7012569996" style={{ color: 'var(--color-neon-red)', textDecoration: 'none' }}>
                70 125 69996
              </a>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>
              Click the number to call
            </p>
          </div>

          {/* WhatsApp Card */}
          <div style={{ background: 'var(--color-surface)', padding: '2.5rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#25D366' }}>WhatsApp</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
              Prefer to chat? Send us a message on WhatsApp:
            </p>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <a href="https://wa.me/917012569996" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>
                Message 70 125 69996
              </a>
            </div>
          </div>

          {/* Instagram Card */}
          <div style={{ background: 'var(--color-surface)', padding: '2.5rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#E1306C' }}>Instagram</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
              Follow our latest updates and DM us:
            </p>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <a href="https://instagram.com/nv.drive" target="_blank" rel="noopener noreferrer" style={{ color: '#E1306C', textDecoration: 'none' }}>
                @nv.drive
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Contact;

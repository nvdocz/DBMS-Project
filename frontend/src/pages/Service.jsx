import React, { useState } from 'react';
import axios from 'axios';

function Service() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    type: 'Oil Change',
    message: ''
  });
  
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await axios.post('http://localhost:5000/api/services', formData);
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', date: '', type: 'Oil Change', message: '' });
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error("Booking error:", error);
      setStatus('error');
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '800px' }}>
      <h1 className="neon-text" style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
        Book a Service
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
        Schedule a maintenance appointment with our specialized technicians.
      </p>

      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--color-neon-red)' }}>
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input required type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input required type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input required type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Date</label>
            <input required type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Service Type</label>
          <select required name="type" className="form-input" value={formData.type} onChange={handleChange}>
            <option value="Oil Change">Oil Change</option>
            <option value="Tire Rotation">Tire Alignment & Rotation</option>
            <option value="Full Inspection">Full Diagnostics & Inspection</option>
            <option value="Engine Tuning">Performance Tuning</option>
            <option value="Detailing">Premium Detailing</option>
            <option value="Car Wash">Premium Car Wash</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Additional Comments</label>
          <textarea name="message" className="form-input" rows="4" value={formData.message} onChange={handleChange} placeholder="Tell us about the issues or specific requests..."></textarea>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" style={{ minWidth: '200px' }} disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Processing...' : 'Confirm Appointment'}
          </button>
          
          {status === 'success' && <p style={{ color: '#00ff00', marginTop: '1rem' }}>Booking confirmed!</p>}
          {status === 'error' && <p style={{ color: 'var(--color-neon-red)', marginTop: '1rem' }}>Error submitting form. Try again.</p>}
        </div>
      </form>
    </div>
  );
}

export default Service;

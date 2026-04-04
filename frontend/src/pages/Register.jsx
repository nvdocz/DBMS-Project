import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', formData);
      setSuccess('Registration successful! You can now log in.');
      setError('');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setSuccess('');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '8rem 2rem', display: 'flex', justifyContent: 'center' }}>
      <form onSubmit={handleRegister} style={{ background: 'var(--color-surface)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)', width: '100%', maxWidth: '450px' }}>
        <h2 className="neon-text" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', color: '#fff' }}>
          Create an Account
        </h2>

        {error && <div style={{ color: 'var(--color-neon-red)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: '#00ff00', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input required type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input required type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} />
        </div>

        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
          <label className="form-label">Password</label>
          <input required type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>Register</button>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--color-text-dim)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--color-neon-red)', textDecoration: 'none' }}>Log In</Link>
        </div>
      </form>
    </div>
  );
}

export default Register;

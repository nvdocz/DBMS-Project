import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      login(response.data.token, response.data.user);
      if (response.data.user.role === 'client') {
        navigate('/');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '8rem 2rem', display: 'flex', justifyContent: 'center' }}>
      <form onSubmit={handleLogin} style={{ background: 'var(--color-surface)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--color-neon-red)', width: '100%', maxWidth: '450px' }}>
        <h2 className="neon-text" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>
          Portal Login
        </h2>

        {error && <div style={{ color: 'var(--color-neon-red)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input required type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
          <label className="form-label">Password</label>
          <input required type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>Sign In</button>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--color-text-dim)' }}>Don't have an account? </span>
          <Link to="/register" style={{ color: 'var(--color-neon-red)', textDecoration: 'none' }}>Register Here</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;

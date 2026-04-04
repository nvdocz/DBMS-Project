import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'marketing' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const resp = await axios.get('/api/users');
      setUsers(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus('Creating user...');
      await axios.post('/api/users', formData);
      setStatus('Successfully added user!');
      fetchUsers();
      setFormData({ name: '', email: '', password: '', role: 'marketing' });
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus(err.response?.data?.error || 'Error creating user');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to disable/delete this user?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      await axios.patch(`/api/users/${id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Access Management</h1>
      
      {/* Create User Form */}
      <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)', marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Create Employee Account</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} placeholder="John Doe"/>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="john@nvdrive.com"/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input required type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select required name="role" className="form-input" value={formData.role} onChange={handleChange}>
                <option value="marketing">Marketing</option>
                <option value="delivery">Delivery</option>
                <option value="manager">Manager</option>
                <option value="ceo">CEO</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>Create Account</button>
          {status && <span style={{ marginLeft: '1rem', color: status.includes('Error') ? 'var(--color-neon-red)' : '#00ff00' }}>{status}</span>}
        </form>
      </div>

      {/* User Table */}
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>All Users & Employees</h2>
      <div className="table-container">
        <table className="neon-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span style={{ textTransform: 'uppercase', color: 'var(--color-neon-red)' }}>{u.role}</span></td>
                <td><span style={{ color: u.status === 'blocked' ? 'var(--color-neon-red)' : '#00ff00' }}>{u.status?.toUpperCase() || 'ACTIVE'}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleStatusChange(u.id, u.status || 'active')} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginRight: '0.5rem', borderColor: '#fff' }}>
                    {u.status === 'blocked' ? 'Unblock' : 'Block'}
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--color-neon-red)' }}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageUsers;

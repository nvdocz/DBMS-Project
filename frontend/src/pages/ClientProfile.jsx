import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

function ClientProfile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);

  useEffect(() => {
    if (user && user.role === 'client') {
      axios.get('http://localhost:5000/api/inquiries').then(res => setInquiries(res.data)).catch(err => console.error(err));
    }
  }, [user]);

  if (!user || user.role !== 'client') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '8rem 2rem' }}>
      <div style={{ background: 'var(--color-surface)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)', maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          Client Profile
        </h2>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Personal Information</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.name}</p>
          <p style={{ color: 'var(--color-neon-red)' }}>{user.email}</p>
        </div>

        <div style={{ padding: '1.5rem', background: '#0a0a0a', borderRadius: '4px', border: '1px solid #333' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>Active Vehicle Inquiries</h3>
          
          {inquiries.length === 0 ? (
            <p style={{ color: 'var(--color-text-dim)', lineHeight: '1.6' }}>You have no inquiries. View our sales or rentals to jumpstart a chat!</p>
          ) : (
            <div className="table-container">
              <table className="neon-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map(inq => (
                    <tr key={inq.id}>
                      <td style={{ fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           <img src={inq.imageUrl} alt={inq.make} style={{ width: '40px', height: '24px', objectFit: 'cover', borderRadius: '2px' }} />
                           {inq.make} {inq.model}
                        </div>
                      </td>
                      <td>
                         <span style={{ color: inq.status === 'completed' ? '#00ff00' : 'var(--color-neon-red)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>{inq.status}</span>
                      </td>
                      <td>{new Date(inq.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => navigate(`/inquiries/${inq.id}`)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Open Chat</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ClientProfile;

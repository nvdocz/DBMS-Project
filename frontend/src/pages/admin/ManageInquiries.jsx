import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ManageInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const resp = await axios.get('http://localhost:5000/api/inquiries');
      setInquiries(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await axios.patch(`http://localhost:5000/api/inquiries/${id}/status`, { status: newStatus });
      fetchInquiries();
    } catch(err) {
      alert("Error updating: " + err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Customer Inquiries</h1>

      <div className="table-container">
        <table className="neon-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vehicle</th>
              <th>Client</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map(inq => (
              <tr key={inq.id}>
                <td>#{inq.id}</td>
                <td style={{ fontWeight: 'bold' }}>{inq.make} {inq.model} ({inq.year})</td>
                <td>
                  <div style={{ fontSize: '0.9rem' }}>{inq.client_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{inq.client_email}</div>
                </td>
                <td>
                  <span style={{ color: inq.status === 'completed' ? '#00ff00' : 'var(--color-neon-red)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {inq.status}
                  </span>
                </td>
                <td>{new Date(inq.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => navigate(`/inquiries/${inq.id}`)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginRight: '0.5rem', borderColor: '#fff' }}>Open Chat</button>
                  <button onClick={() => toggleStatus(inq.id, inq.status)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    Mark {inq.status === 'pending' ? 'Completed' : 'Pending'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inquiries.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No active inquiries.</p>}
      </div>
    </div>
  );
}

export default ManageInquiries;

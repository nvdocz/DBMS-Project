import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageServices() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const resp = await axios.get('/api/services');
      setServices(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const statuses = ['pending', 'progress', 'completed', 'cancelled'];
    const currentIndex = statuses.indexOf(currentStatus);
    const newStatus = statuses[(currentIndex + 1) % statuses.length];
    
    try {
      await axios.patch(`/api/services/${id}/status`, { status: newStatus });
      fetchServices();
    } catch(err) {
      alert("Error updating: " + err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Service Appointments</h1>

      <div className="table-container">
        <table className="neon-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client Name</th>
              <th>Contact Info</th>
              <th>Service Details</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
               <tr key={s.id}>
                 <td>#{s.id}</td>
                 <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                 <td>
                   <div style={{ fontSize: '0.9rem' }}>{s.email}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{s.phone}</div>
                 </td>
                 <td>
                   <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{s.type}</div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--color-neon-red)' }}>Date: {new Date(s.date).toLocaleDateString()}</div>
                   {s.message && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '0.2rem', maxWidth: '250px' }}>Msg: {s.message}</div>}
                 </td>
                 <td>
                   <span style={{ 
                     color: s.status === 'completed' ? '#00ff00' : (s.status === 'progress' ? '#ffaa00' : (s.status === 'cancelled' ? 'var(--color-neon-red)' : 'var(--color-text-primary)')), 
                     textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' 
                   }}>
                     {s.status || 'pending'}
                   </span>
                 </td>
                 <td>
                   <button onClick={() => toggleStatus(s.id, s.status || 'pending')} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                     Change Status
                   </button>
                 </td>
               </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No service appointments found.</p>}
      </div>
    </div>
  );
}

export default ManageServices;

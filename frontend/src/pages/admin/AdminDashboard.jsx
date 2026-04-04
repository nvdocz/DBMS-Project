import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ cars: 0, contacts: 0, unreadContacts: 0, services: 0, pendingInquiries: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [carsRes, contactsRes, servicesRes, inquiriesRes] = await Promise.all([
          axios.get('/api/cars'),
          axios.get('/api/contacts'),
          axios.get('/api/services'),
          axios.get('/api/inquiries')
        ]);
        const pending = inquiriesRes.data.filter(i => i.status === 'pending').length;
        const unread = contactsRes.data.filter(c => !c.is_read).length;
        setStats({
          cars: carsRes.data.length,
          contacts: contactsRes.data.length,
          unreadContacts: unread,
          services: servicesRes.data.length,
          pendingInquiries: pending
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome, {user.name}</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
        Here's what is happening at nv.drive today.
      </p>

      <div className="grid">
        <div className="card" style={{ cursor: 'default' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h3 style={{ color: 'var(--color-text-secondary)' }}>Total Vehicles</h3>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--color-neon-red)', marginTop: '1rem' }}>
              {stats.cars}
            </div>
          </div>
        </div>

        <div className="card" style={{ cursor: 'default' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h3 style={{ color: 'var(--color-text-secondary)' }}>Pending Inquiries</h3>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--color-neon-red)', marginTop: '1rem' }}>
              {stats.pendingInquiries}
            </div>
          </div>
        </div>

        <div className="card" style={{ cursor: 'default' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h3 style={{ color: 'var(--color-text-secondary)' }}>Service Appointments</h3>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--color-neon-red)', marginTop: '1rem' }}>
              {stats.services}
            </div>
          </div>
        </div>

        <div className="card" onClick={() => navigate('/admin/contacts')} style={{ cursor: 'pointer' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h3 style={{ color: 'var(--color-text-secondary)' }}>Contact Messages</h3>
            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--color-neon-red)', marginTop: '1rem' }}>
              {stats.contacts}
            </div>
            {stats.unreadContacts > 0 && (
              <div style={{
                marginTop: '0.5rem', display: 'inline-block',
                background: 'var(--color-neon-red)', color: '#fff',
                borderRadius: '12px', padding: '0.2rem 0.75rem',
                fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'var(--font-body)',
              }}>
                {stats.unreadContacts} unread
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

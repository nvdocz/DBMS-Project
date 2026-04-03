import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

function ClientProfile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('rentals');

  useEffect(() => {
    if (user && user.role === 'client') {
      axios.get('http://localhost:5000/api/inquiries').then(res => setInquiries(res.data)).catch(err => console.error(err));
      axios.get(`http://localhost:5000/api/services?email=${user.email}`).then(res => setServices(res.data)).catch(err => console.error(err));
      axios.get(`http://localhost:5000/api/bookings`).then(res => setBookings(res.data)).catch(err => console.error(err));
    }
  }, [user]);

  const cancelService = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await axios.patch(`http://localhost:5000/api/services/${id}/status`, { status: 'cancelled' });
      setServices(services.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    } catch (err) {
      alert("Error cancelling appointment: " + (err.response?.data?.error || err.message));
    }
  };

  if (!user || user.role !== 'client') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '8rem 2rem' }}>
      <div style={{ background: 'var(--color-surface)', padding: '3rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)', maxWidth: '900px', margin: '0 auto' }}>
        <h2 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          Client Profile
        </h2>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Personal Information</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.name}</p>
          <p style={{ color: 'var(--color-neon-red)' }}>{user.email}</p>
        </div>

        <div style={{ padding: '1.5rem', background: '#0a0a0a', borderRadius: '4px', border: '1px solid #333' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>Need Assistance?</h3>
          <p style={{ color: 'var(--color-text-dim)', lineHeight: '1.6' }}>
            Contact Us: <a href="tel:7012569996" style={{ color: 'var(--color-neon-red)', textDecoration: 'none', fontWeight: 'bold' }}>70 125 69996</a>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #333' }}>
          <button 
            onClick={() => setActiveTab('rentals')}
            style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'rentals' ? '2px solid var(--color-neon-red)' : '2px solid transparent', color: activeTab === 'rentals' ? 'var(--color-text-primary)' : 'var(--color-text-dim)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', marginRight: '1rem' }}
          >
            Rental Bookings
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'services' ? '2px solid var(--color-neon-red)' : '2px solid transparent', color: activeTab === 'services' ? 'var(--color-text-primary)' : 'var(--color-text-dim)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', marginRight: '1rem' }}
          >
            Service Appointments
          </button>
          <button 
            onClick={() => setActiveTab('purchases')}
            style={{ padding: '1rem 0', background: 'none', border: 'none', borderBottom: activeTab === 'purchases' ? '2px solid var(--color-neon-red)' : '2px solid transparent', color: activeTab === 'purchases' ? 'var(--color-text-primary)' : 'var(--color-text-dim)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            Vehicle Inquiries
          </button>
        </div>

        {activeTab === 'rentals' && (
          <div>
            <h3 className="neon-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Active Rentals</h3>
            {bookings.length > 0 ? (
              <div className="table-container">
                <table className="neon-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Dates</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 'bold' }}>{b.make} {b.model}</td>
                        <td>{new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold' }}>₹{b.total_price.toLocaleString('en-IN')}</td>
                        <td>
                          <span style={{ 
                            color: b.status === 'completed' ? '#00ff00' : (b.status === 'confirmed' ? 'var(--color-text-primary)' : 'var(--color-neon-red)'), 
                            textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' 
                          }}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', padding: '1rem 0' }}>You have no active rental bookings.</p>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <h3 className="neon-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Service Appointments</h3>
            {services.length > 0 ? (
              <div className="table-container">
                <table className="neon-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(s => (
                      <tr key={s.id}>
                        <td>{new Date(s.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold' }}>{s.type}</td>
                        <td>
                          <span style={{ 
                            color: s.status === 'completed' ? '#00ff00' : (s.status === 'progress' ? '#ffaa00' : (s.status === 'cancelled' ? 'var(--color-neon-red)' : 'var(--color-text-primary)')), 
                            textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' 
                          }}>
                            {s.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          {(s.status === 'pending' || !s.status) ? (
                            <button onClick={() => cancelService(s.id)} className="btn" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', borderColor: 'var(--color-neon-red)', color: 'var(--color-neon-red)' }}>Cancel</button>
                          ) : (
                            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', padding: '1rem 0' }}>You have no active service appointments.</p>
            )}
          </div>
        )}

        {activeTab === 'purchases' && (
          <div>
             <h3 className="neon-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Purchase Inquiries</h3>
             {inquiries.length > 0 ? (
                <div className="table-container">
                  <table className="neon-table">
                    <thead>
                      <tr>
                        <th>Vehicle</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map(inq => (
                        <tr key={inq.id}>
                          <td style={{ fontWeight: 'bold' }}>{inq.make} {inq.model} ({inq.year})</td>
                          <td>Purchase/Inquiry</td>
                          <td>
                            <span style={{ color: inq.status === 'completed' ? '#00ff00' : 'var(--color-neon-red)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              {inq.status}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => navigate(`/inquiries/${inq.id}`)} className="btn" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', borderColor: '#fff', position: 'relative' }}>
                              Open Chat
                              {inq.unread_count > 0 && (
                                <span style={{
                                  position: 'absolute', top: '-8px', right: '-8px',
                                  background: 'var(--color-neon-red)', color: '#fff',
                                  borderRadius: '50%', width: '20px', height: '20px',
                                  fontSize: '0.7rem', fontWeight: 'bold',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontFamily: 'var(--font-body)', boxShadow: '0 0 6px var(--color-neon-red-glow)'
                                }}>
                                  {inq.unread_count > 99 ? '99+' : inq.unread_count}
                                </span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             ) : (
               <p style={{ color: 'var(--color-text-secondary)', padding: '1rem 0' }}>You have no active purchase inquiries.</p>
             )}
          </div>
        )}

      </div>
    </div>
  );
}

export default ClientProfile;

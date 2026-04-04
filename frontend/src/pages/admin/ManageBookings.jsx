import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [formData, setFormData] = useState({
    car_id: '',
    client_id: '',
    start_date: '',
    end_date: '',
    total_price: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (formData.start_date && formData.end_date && formData.car_id) {
       const start = new Date(formData.start_date);
       const end = new Date(formData.end_date);
       const timeDiff = end - start;
       let days = Math.ceil(timeDiff / (1000 * 3600 * 24));
       if (days <= 0) days = 1;

       const selectedCar = cars.find(c => c.id.toString() === formData.car_id.toString());
       if (selectedCar && selectedCar.price) {
          setFormData(prev => ({ ...prev, total_price: days * selectedCar.price }));
       }
    }
  }, [formData.start_date, formData.end_date, formData.car_id, cars]);

  const fetchBookings = async () => {
    try {
      const resp = await axios.get('/api/bookings');
      setBookings(resp.data);
    } catch (err) {
      console.error("Failed to load bookings", err);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [carsRes, usersRes] = await Promise.all([
        axios.get('/api/cars'),
        axios.get('/api/users')
      ]);
      setCars(carsRes.data.filter(c => c.type === 'rentals'));
      setClients(usersRes.data.filter(u => u.role === 'client'));
    } catch (err) {
      console.error("Failed to load dependencies", err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/bookings/${id}/status`, { status: newStatus });
      fetchBookings();
    } catch(err) {
      alert("Error updating: " + err.message);
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this booking?")) return;
    try {
      await axios.delete(`/api/bookings/${id}`);
      fetchBookings();
    } catch(err) {
      alert("Error deleting booking: " + (err.response?.data?.error || err.message));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/bookings', formData);
      setIsCreating(false);
      setFormData({ car_id: '', client_id: '', start_date: '', end_date: '', total_price: '' });
      fetchBookings();
    } catch (err) {
      alert("Error creating booking: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="neon-text" style={{ fontSize: '2.5rem', margin: 0 }}>Booking Management</h1>
        <button onClick={() => setIsCreating(!isCreating)} className="btn btn-primary">
          {isCreating ? 'Cancel' : 'Create New Booking'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--color-surface-light)' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Create Booking</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Client</label>
              <select required className="form-input" value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})}>
                <option value="">Select a client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rental Vehicle</label>
              <select required className="form-input" value={formData.car_id} onChange={(e) => setFormData({...formData, car_id: e.target.value})}>
                <option value="">Select a vehicle</option>
                {cars.map(c => <option key={c.id} value={c.id}>{c.make} {c.model}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input required type="date" className="form-input" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input required type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Total Price (₹)</label>
              <input required type="number" className="form-input" value={formData.total_price} onChange={(e) => setFormData({...formData, total_price: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Booking</button>
        </form>
      )}

      <div className="table-container">
        <table className="neon-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Vehicle</th>
              <th>Dates</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}>
                <td>#{b.id}</td>
                <td>
                  <div style={{ fontWeight: 'bold' }}>{b.client_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{b.client_email}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={b.imageUrl} alt={b.make} style={{ width: '30px', height: '20px', objectFit: 'cover', borderRadius: '2px' }} />
                    {b.make} {b.model}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.9rem' }}>{new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}</div>
                </td>
                <td style={{ fontWeight: 'bold' }}>₹{b.total_price.toLocaleString('en-IN')}</td>
                <td>
                  <span style={{
                    display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                    background: b.status === 'completed' ? 'rgba(0,255,0,0.1)' : b.status === 'confirmed' ? 'rgba(255,255,255,0.08)' : 'rgba(255,42,42,0.1)',
                    color: b.status === 'completed' ? '#00ff00' : b.status === 'confirmed' ? 'var(--color-text-primary)' : 'var(--color-neon-red)',
                    border: `1px solid ${b.status === 'completed' ? '#00ff00' : b.status === 'confirmed' ? '#555' : 'var(--color-neon-red)'}`,
                  }}>
                    {b.status}
                  </span>
                </td>
                <td>
                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b.id, e.target.value)}
                    className="form-input"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: 'auto', marginBottom: '0.5rem' }}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <br />
                  <button onClick={() => deleteBooking(b.id)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--color-neon-red)', color: 'var(--color-neon-red)' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No bookings found.</p>}
      </div>
    </div>
  );
}

export default ManageBookings;

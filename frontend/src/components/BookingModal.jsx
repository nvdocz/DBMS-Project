import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function BookingModal({ car, onClose, onSuccess }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availability, setAvailability] = useState(null); // null | { available, nextAvailableDate }
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate) - new Date(startDate);
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const days = calcDays();
  const totalPrice = days * car.price;

  const checkAvailability = async () => {
    if (!startDate || !endDate) return setError('Please select both dates.');
    if (days <= 0) return setError('End date must be after start date.');
    setError('');
    setChecking(true);
    try {
      const res = await axios.post('http://localhost:5000/api/bookings/check', {
        car_id: car.id,
        start_date: startDate,
        end_date: endDate,
      });
      setAvailability(res.data);
    } catch (err) {
      setError('Failed to check availability.');
    } finally {
      setChecking(false);
    }
  };

  const handleBook = async () => {
    if (!user) { navigate('/login'); return; }
    if (!availability?.available) return;
    setSubmitting(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/bookings', {
        car_id: car.id,
        start_date: startDate,
        end_date: endDate,
        total_price: totalPrice,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '1rem'
    }}>
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-neon-red)',
        borderRadius: '8px', padding: '2rem', width: '100%', maxWidth: '480px',
        boxShadow: '0 0 30px var(--color-neon-red-glow)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '0.25rem' }}>
              Book Vehicle
            </h2>
            <p style={{ color: 'var(--color-neon-red)', fontWeight: 'bold' }}>
              {car.make} {car.model} ({car.year})
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Car image + rate */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <img src={car.imageUrl} alt={car.make} style={{ width: '100px', height: '65px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-surface-light)' }} />
          <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Daily Rate</p>
            <p style={{ color: 'var(--color-neon-red)', fontWeight: 'bold', fontSize: '1.4rem' }}>
              ₹{car.price.toLocaleString('en-IN')}<span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}> / day</span>
            </p>
          </div>
        </div>

        {/* Date inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Date</label>
            <input
              type="date" className="form-input" min={today}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setAvailability(null); }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Date</label>
            <input
              type="date" className="form-input" min={startDate || today}
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setAvailability(null); }}
            />
          </div>
        </div>

        {/* Price summary */}
        {days > 0 && (
          <div style={{ background: '#0a0a0a', border: '1px solid var(--color-surface-light)', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Duration</span>
              <span>{days} day{days > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Rate</span>
              <span>₹{car.price.toLocaleString('en-IN')} × {days}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-surface-light)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 'bold' }}>Total</span>
              <span style={{ color: 'var(--color-neon-red)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                ₹{totalPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Availability result */}
        {availability && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem',
            background: availability.available ? 'rgba(0,255,0,0.08)' : 'rgba(255,42,42,0.08)',
            border: `1px solid ${availability.available ? '#00ff00' : 'var(--color-neon-red)'}`,
          }}>
            {availability.available ? (
              <p style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.9rem' }}>✓ Available for selected dates</p>
            ) : (
              <div>
                <p style={{ color: 'var(--color-neon-red)', fontWeight: 'bold', fontSize: '0.9rem' }}>✗ Not available for selected dates</p>
                {availability.nextAvailableDate && (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Next available from: <strong style={{ color: 'var(--color-text-primary)' }}>{new Date(availability.nextAvailableDate).toLocaleDateString()}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {error && <p style={{ color: 'var(--color-neon-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!availability?.available ? (
            <button
              className="btn btn-primary" style={{ flex: 1 }}
              onClick={checkAvailability} disabled={checking || !startDate || !endDate}
            >
              {checking ? 'Checking...' : 'Check Availability'}
            </button>
          ) : (
            <button
              className="btn btn-primary" style={{ flex: 1 }}
              onClick={handleBook} disabled={submitting}
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          )}
          <button className="btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default BookingModal;

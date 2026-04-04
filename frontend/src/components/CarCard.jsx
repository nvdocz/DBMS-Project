import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import BookingModal from './BookingModal';

function CarCard({ car }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleInquire = async () => {
    if (!user) {
      alert("Please log in to inquire about this vehicle.");
      navigate('/login');
      return;
    }
    if (user.role !== 'client') {
      alert("Employee accounts use the dashboard to manage inquiries.");
      return;
    }
    try {
      const resp = await axios.post('/api/inquiries', { car_id: car.id });
      navigate(`/inquiries/${resp.data.id}`);
    } catch (err) {
      alert("Failed to start inquiry: " + (err.response?.data?.error || err.message));
    }
  };

  const handleRentClick = () => {
    if (!user) {
      alert("Please log in to book this vehicle.");
      navigate('/login');
      return;
    }
    if (user.role !== 'client') {
      alert("Employee accounts use the dashboard to manage bookings.");
      return;
    }
    setShowBooking(true);
  };

  const handleBookingSuccess = () => {
    setShowBooking(false);
    setBookingSuccess(true);
  };

  return (
    <>
      <div className="card">
        <div className="card-img-container">
          <img src={car.imageUrl} alt={`${car.make} ${car.model}`} className="card-img" />
        </div>
        <div className="card-body">
          <h3 className="card-title">{car.make} {car.model}</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Year: {car.year}</p>
          <div className="card-price">
            ₹{car.price.toLocaleString('en-IN')}
            {car.type === 'rentals' && (
              <span style={{ fontSize: '1rem', color: 'var(--color-text-secondary)' }}> / day</span>
            )}
          </div>
          <p className="card-desc">{car.description}</p>

          {bookingSuccess ? (
            <div style={{
              padding: '0.75rem', background: 'rgba(0,255,0,0.08)',
              border: '1px solid #00ff00', borderRadius: '4px', textAlign: 'center'
            }}>
              <p style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.9rem' }}>✓ Booking Confirmed!</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                View in your <span
                  onClick={() => navigate('/profile')}
                  style={{ color: 'var(--color-neon-red)', cursor: 'pointer', textDecoration: 'underline' }}
                >profile</span>
              </p>
            </div>
          ) : (
            <button
              className="btn btn-primary" style={{ width: '100%' }}
              onClick={car.type === 'sales' ? handleInquire : handleRentClick}
            >
              {car.type === 'sales' ? 'Inquire Now' : 'Rent Now'}
            </button>
          )}
        </div>
      </div>

      {showBooking && (
        <BookingModal
          car={car}
          onClose={() => setShowBooking(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
}

export default CarCard;

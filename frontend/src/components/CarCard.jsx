import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function CarCard({ car }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
      const resp = await axios.post('http://localhost:5000/api/inquiries', { car_id: car.id });
      navigate(`/inquiries/${resp.data.id}`);
    } catch (err) {
      alert("Failed to start inquiry: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="card">
      <div className="card-img-container">
        <img src={car.imageUrl} alt={`${car.make} ${car.model}`} className="card-img" />
      </div>
      <div className="card-body">
        <h3 className="card-title">{car.make} {car.model}</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Year: {car.year}</p>
        <div className="card-price">
          ₹{car.price.toLocaleString('en-IN')} {car.type === 'rentals' && <span style={{fontSize: '1rem', color: 'var(--color-text-secondary)'}}>/ day</span>}
        </div>
        <p className="card-desc">{car.description}</p>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleInquire}>
          {car.type === 'sales' ? 'Inquire Now' : 'Rent Now'}
        </button>
      </div>
    </div>
  );
}

export default CarCard;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CarCard from '../components/CarCard';

function Home() {
  const [featuredCars, setFeaturedCars] = useState([]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await axios.get('/api/cars');
        const shuffled = [...response.data].sort(() => 0.5 - Math.random());
        setFeaturedCars(shuffled.slice(0, 3));
      } catch (error) {
        console.error('Error fetching cars:', error);
      }
    };
    fetchCars();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="hero-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 className="neon-text hero-title">Driven By Trust</h1>
          <p className="hero-subtitle">
            Drive the extraordinary. Explore our exclusive collection of luxury vehicles for sale and rent.
          </p>
          <div className="hero-buttons">
            <Link to="/sales" className="btn btn-primary">Browse Sales</Link>
            <Link to="/rentals" className="btn">View Rentals</Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container" style={{ padding: '4rem 2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>
          <span className="neon-text">Featured</span> Inventory
        </h2>
        {featuredCars.length > 0 ? (
          <div className="grid">
            {featuredCars.map(car => <CarCard key={car.id} car={car} />)}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading featured cars...</p>
        )}
      </section>

      {/* Service CTA */}
      <section className="service-cta">
        <div className="container">
          <div className="service-cta-inner">
            <div>
              <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 2rem)', marginBottom: '1.25rem' }}>
                Premium <span style={{ color: 'var(--color-neon-red)' }}>Service</span> & Maintenance
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.75rem', lineHeight: '1.8' }}>
                Keep your dream car in pristine condition. Our state-of-the-art facility is equipped with
                top-tier diagnostics and highly skilled technicians dedicated to performance vehicles.
              </p>
              <Link to="/service" className="btn btn-primary">Book a Service</Link>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800"
                alt="Car Service"
                style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-neon-red)', boxShadow: '0 0 20px var(--color-neon-red-glow)' }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

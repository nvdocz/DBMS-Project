import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CarCard from '../components/CarCard';

function Home() {
  const [featuredCars, setFeaturedCars] = useState([]);

  useEffect(() => {
    // Fetch a couple of sales and rentals to feature
    const fetchCars = async () => {
      try {
        const response = await axios.get('/api/cars');
        // Get 3 random cars for the feature section
        const cars = response.data;
        const shuffled = [...cars].sort(() => 0.5 - Math.random());
        setFeaturedCars(shuffled.slice(0, 3));
      } catch (error) {
        console.error("Error fetching cars:", error);
      }
    };
    fetchCars();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{
        height: '80vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url("https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1920") center/cover',
        borderBottom: '2px solid var(--color-neon-red)'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem' }} className="neon-text">
            Driven By Trust
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Drive the extraordinary. Explore our exclusive collection of luxury vehicles for sale and rent. 
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <Link to="/sales" className="btn btn-primary">Browse Sales</Link>
            <Link to="/rentals" className="btn">View Rentals</Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="container" style={{ padding: '5rem 2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>
          <span className="neon-text">Featured</span> Inventory
        </h2>
        
        {featuredCars.length > 0 ? (
          <div className="grid">
            {featuredCars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading featured cars...</p>
        )}
      </section>

      {/* Services CTA */}
      <section style={{ background: 'var(--color-surface)', padding: '5rem 0', borderTop: '1px solid var(--color-surface-light)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '4rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Premium <span style={{color: 'var(--color-neon-red)'}}>Service</span> & Maintenance</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.8' }}>
              Keep your dream car in pristine condition. Our state-of-the-art facility is equipped with top-tier diagnostics and highly skilled technicians dedicated to performance vehicles.
            </p>
            <Link to="/service" className="btn btn-primary">Book a Service</Link>
          </div>
          <div style={{ flex: 1 }}>
            <img 
              src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800" 
              alt="Car Service" 
              style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-neon-red)', boxShadow: '0 0 20px var(--color-neon-red-glow)' }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

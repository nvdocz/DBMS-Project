import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CarCard from '../components/CarCard';

function Rentals() {
  const [cars, setCars] = useState([]);
  const [searchPath, setSearchPath] = useState('');

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async (searchParams = '') => {
    try {
      const url = "http://localhost:5000/api/cars?type=rentals" + (searchParams ? "&search=" + searchParams : "");
      const response = await axios.get(url);
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching rental inventory:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCars(searchPath);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem' }}>
      <h1 className="neon-text" style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>
        Exotic Rentals
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '3rem', maxWidth: '800px', margin: '0 auto' }}>
        Experience unfiltered thrill for a weekend or a season. Browse our premium rental fleet featuring top marques.
      </p>

      {/* Filteration Process */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search make or model..." 
          style={{ maxWidth: '400px' }}
          value={searchPath}
          onChange={(e) => setSearchPath(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Filter</button>
      </form>

      <div className="grid">
        {cars.length > 0 ? (
          cars.map(car => <CarCard key={car.id} car={car} />)
        ) : (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No rental vehicles match your search.
          </p>
        )}
      </div>
    </div>
  );
}

export default Rentals;

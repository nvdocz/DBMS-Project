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
      const url = "/api/cars?type=rentals" + (searchParams ? "&search=" + searchParams : "");
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
      <h1 className="neon-text" style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', marginBottom: '1rem', textAlign: 'center' }}>
        Exotic Rentals
      </h1>
      <p className="page-subtitle">
        Experience unfiltered thrill for a weekend or a season. Browse our premium rental fleet featuring top marques.
      </p>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          className="form-input"
          placeholder="Search make or model..."
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

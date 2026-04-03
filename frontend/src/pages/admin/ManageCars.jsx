import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageCars() {
  const [cars, setCars] = useState([]);
  const [formData, setFormData] = useState({ make: '', model: '', year: '', price: '', description: '', type: 'sales' });
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const resp = await axios.get('http://localhost:5000/api/cars');
      setCars(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
  const handleFileChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { setStatus('Please select an image file'); return; }

    const data = new FormData();
    data.append('make', formData.make);
    data.append('model', formData.model);
    data.append('year', formData.year);
    data.append('price', formData.price);
    data.append('description', formData.description);
    data.append('type', formData.type);
    data.append('image', image);

    try {
      setStatus('Uploading...');
      await axios.post('http://localhost:5000/api/cars', data, {
        headers: { 'Content-Type': 'multipart/form-data' } // Auth headers are set globally in AuthContext
      });
      setStatus('Successfully added car!');
      fetchCars();
      setFormData({ make: '', model: '', year: '', price: '', description: '', type: 'sales' });
      setImage(null);
      e.target.reset(); // Reset file input
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus(err.response?.data?.error || 'Error uploading car');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure you want to delete this car?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/cars/${id}`);
      fetchCars();
    } catch (err) {
      alert('Error deleting car: ' + err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Manage Vehicles</h1>
      
      {/* Upload Form */}
      <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)', marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Add New Car</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Make</label>
              <input required type="text" name="make" className="form-input" value={formData.make} onChange={handleChange} placeholder="e.g. Porsche"/>
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input required type="text" name="model" className="form-input" value={formData.model} onChange={handleChange} placeholder="e.g. 911 GT3"/>
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input required type="number" name="year" className="form-input" value={formData.year} onChange={handleChange} placeholder="2024"/>
            </div>
            <div className="form-group">
              <label className="form-label">Price (Total or per Day)</label>
              <input required type="number" name="price" className="form-input" value={formData.price} onChange={handleChange} placeholder="150000"/>
            </div>
            <div className="form-group">
              <label className="form-label">Listing Type</label>
              <select required name="type" className="form-input" value={formData.type} onChange={handleChange}>
                <option value="sales">Sales</option>
                <option value="rentals">Rentals</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Image Upload (Required)</label>
              <input required type="file" name="image" className="form-input" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea required name="description" className="form-input" rows="3" value={formData.description} onChange={handleChange}></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>Upload Car</button>
          {status && <span style={{ marginLeft: '1rem', color: status.includes('Error') ? 'var(--color-neon-red)' : '#00ff00' }}>{status}</span>}
        </form>
      </div>

      {/* Inventory Table */}
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Current Inventory</h2>
      <div className="table-container">
        <table className="neon-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Make & Model</th>
              <th>Year</th>
              <th>Type</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cars.map(c => (
              <tr key={c.id}>
                <td>#{c.id}</td>
                <td style={{ fontWeight: 'bold' }}>{c.make} {c.model}</td>
                <td>{c.year}</td>
                <td><span style={{ textTransform: 'capitalize', color: c.type === 'sales' ? 'var(--color-text-primary)' : 'var(--color-neon-red)' }}>{c.type}</span></td>
                <td>₹{c.price.toLocaleString('en-IN')}</td>
                <td>
                  <button onClick={() => handleDelete(c.id)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--color-neon-red)' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageCars;

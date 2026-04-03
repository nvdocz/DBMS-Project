import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function ManageCars() {
  const [cars, setCars] = useState([]);
  const [formData, setFormData] = useState({ make: '', model: '', year: '', price: '', description: '', type: 'sales' });
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('');
  const [editingCar, setEditingCar] = useState(null); // holds car object being edited
  const [editImage, setEditImage] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const editFormRef = useRef(null);
  const addFormRef = useRef(null);

  useEffect(() => { fetchCars(); }, []);

  const fetchCars = async () => {
    try {
      const resp = await axios.get('http://localhost:5000/api/cars');
      setCars(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) { setStatus('Please select an image file'); return; }
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    data.append('image', image);
    try {
      setStatus('Uploading...');
      await axios.post('http://localhost:5000/api/cars', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStatus('Successfully added car!');
      fetchCars();
      setFormData({ make: '', model: '', year: '', price: '', description: '', type: 'sales' });
      setImage(null);
      addFormRef.current?.reset();
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus(err.response?.data?.error || 'Error uploading car');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/cars/${id}`);
      fetchCars();
    } catch (err) {
      alert('Error deleting car: ' + err.message);
    }
  };

  const startEdit = (car) => {
    setEditingCar({ ...car });
    setEditImage(null);
    setEditStatus('');
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelEdit = () => { setEditingCar(null); setEditImage(null); setEditStatus(''); };

  const handleEditChange = (e) => setEditingCar({ ...editingCar, [e.target.name]: e.target.value });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditStatus('Saving...');
      if (editImage) {
        // multipart only when a new image is selected
        const data = new FormData();
        data.append('make', editingCar.make);
        data.append('model', editingCar.model);
        data.append('year', editingCar.year);
        data.append('price', editingCar.price);
        data.append('description', editingCar.description);
        data.append('type', editingCar.type);
        data.append('image', editImage);
        await axios.put(`http://localhost:5000/api/cars/${editingCar.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // plain JSON when no image change — avoids multer issues
        await axios.put(`http://localhost:5000/api/cars/${editingCar.id}`, {
          make: editingCar.make,
          model: editingCar.model,
          year: editingCar.year,
          price: editingCar.price,
          description: editingCar.description,
          type: editingCar.type,
        });
      }
      setEditStatus('Updated successfully!');
      fetchCars();
      setTimeout(() => cancelEdit(), 1200);
    } catch (err) {
      setEditStatus(err.response?.data?.error || 'Error updating car');
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Manage Vehicles</h1>

      {/* Edit Form */}
      {editingCar && (
        <div ref={editFormRef} style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--color-neon-red)', marginBottom: '3rem', boxShadow: '0 0 20px var(--color-neon-red-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Edit — {editingCar.make} {editingCar.model}</h2>
            <button onClick={cancelEdit} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Cancel</button>
          </div>

          <form onSubmit={handleEditSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Make</label>
                <input required type="text" name="make" className="form-input" value={editingCar.make} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input required type="text" name="model" className="form-input" value={editingCar.model} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input required type="number" name="year" className="form-input" value={editingCar.year} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Price</label>
                <input required type="number" name="price" className="form-input" value={editingCar.price} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Listing Type</label>
                <select required name="type" className="form-input" value={editingCar.type} onChange={handleEditChange}>
                  <option value="sales">Sales</option>
                  <option value="rentals">Rentals</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Replace Image (optional)</label>
                <input type="file" name="image" className="form-input" accept="image/*" onChange={(e) => setEditImage(e.target.files[0])} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea required name="description" className="form-input" rows="3" value={editingCar.description} onChange={handleEditChange}></textarea>
            </div>
            {/* Current image preview */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={editingCar.imageUrl} alt="current" style={{ width: '100px', height: '65px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-surface-light)' }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Current image — upload a new one to replace it</span>
            </div>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>Save Changes</button>
            {editStatus && (
              <span style={{ marginLeft: '1rem', color: editStatus.includes('Error') ? 'var(--color-neon-red)' : '#00ff00' }}>{editStatus}</span>
            )}
          </form>
        </div>
      )}

      {/* Add Form */}
      <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--color-surface-light)', marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Add New Car</h2>
        <form onSubmit={handleSubmit} ref={addFormRef}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Make</label>
              <input required type="text" name="make" className="form-input" value={formData.make} onChange={handleChange} placeholder="e.g. Porsche" />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input required type="text" name="model" className="form-input" value={formData.model} onChange={handleChange} placeholder="e.g. 911 GT3" />
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <input required type="number" name="year" className="form-input" value={formData.year} onChange={handleChange} placeholder="2024" />
            </div>
            <div className="form-group">
              <label className="form-label">Price (Total or per Day)</label>
              <input required type="number" name="price" className="form-input" value={formData.price} onChange={handleChange} placeholder="150000" />
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
              <tr key={c.id} style={{ background: editingCar?.id === c.id ? 'rgba(255,42,42,0.05)' : undefined }}>
                <td>#{c.id}</td>
                <td style={{ fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={c.imageUrl} alt={c.make} style={{ width: '40px', height: '26px', objectFit: 'cover', borderRadius: '2px' }} />
                    {c.make} {c.model}
                  </div>
                </td>
                <td>{c.year}</td>
                <td>
                  <span style={{ textTransform: 'capitalize', color: c.type === 'sales' ? 'var(--color-text-primary)' : 'var(--color-neon-red)' }}>{c.type}</span>
                </td>
                <td>₹{c.price.toLocaleString('en-IN')}</td>
                <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => startEdit(c)}
                    className="btn"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#fff', color: '#fff' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="btn"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--color-neon-red)', color: 'var(--color-neon-red)' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cars.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No vehicles in inventory.</p>}
      </div>
    </div>
  );
}

export default ManageCars;

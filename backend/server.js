require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { verifyToken, hasRole, JWT_SECRET } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
// Serve static upload files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Storage Setup for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- AUTHENTICATION ROUTES ---
// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.status === 'blocked') return res.status(403).json({ error: 'Account is blocked' });

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  });
});

// Register (Client)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const role = 'client';
  const status = 'active';

  db.run('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, role, status], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Registration successful' });
  });
});

// GET all users (CEO, Manager only)
app.get('/api/users', verifyToken, hasRole(['ceo', 'manager']), (req, res) => {
  db.all('SELECT id, name, email, role, status, created_at FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// CREATE a new user (CEO, Manager only)
app.post('/api/users', verifyToken, hasRole(['ceo', 'manager']), (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)', [name, email, hashedPassword, role, 'active'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

// DELETE a user
app.delete('/api/users/:id', verifyToken, hasRole(['ceo', 'manager']), (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// UPDATE user status (Block/Unblock)
app.patch('/api/users/:id/status', verifyToken, hasRole(['ceo', 'manager']), (req, res) => {
  const { status } = req.body;
  if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.run('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- PUBLIC ROUTES (Sales, Rentals, etc) ---
app.get('/api/cars', (req, res) => {
  const { type, search } = req.query;
  let query = 'SELECT * FROM cars WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (search) {
    query += ' AND (make LIKE ? OR model LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// PUBLIC Contacts
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  db.run('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', [name, email, message], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

// PUBLIC Services
app.post('/api/services', (req, res) => {
  const { name, email, phone, date, type, message } = req.body;
  db.run('INSERT INTO services (name, email, phone, date, type, message) VALUES (?, ?, ?, ?, ?, ?)', [name, email, phone, date, type, message], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

// --- PROTECTED ADMIN ROUTES ---

// CREATE a car (CEO, Manager, Marketing)
app.post('/api/cars', verifyToken, hasRole(['ceo', 'manager', 'marketing']), upload.single('image'), (req, res) => {
  const { make, model, year, price, description, type } = req.body;
  
  // imageUrl can either be the uploaded local file path, or the existing ones if we are expanding.
  const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
  if (!imageUrl) return res.status(400).json({ error: 'Image file is required' });

  const query = 'INSERT INTO cars (make, model, year, price, description, imageUrl, type) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.run(query, [make, model, year, price, description, imageUrl, type], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, success: true });
  });
});

// DELETE a car (CEO, Manager, Marketing)
app.delete('/api/cars/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing']), (req, res) => {
  db.run('DELETE FROM cars WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// GET all contacts
app.get('/api/contacts', verifyToken, (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET all services
app.get('/api/services', verifyToken, (req, res) => {
  db.all('SELECT * FROM services ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- INQUIRIES ---
app.post('/api/inquiries', verifyToken, (req, res) => {
  const { car_id } = req.body;
  const client_id = req.user.id;

  db.get('SELECT * FROM inquiries WHERE car_id = ? AND client_id = ? AND status = "pending"', [car_id, client_id], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) {
      return res.json({ id: existing.id, success: true, isNew: false });
    } else {
      db.run('INSERT INTO inquiries (car_id, client_id) VALUES (?, ?)', [car_id, client_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const newId = this.lastID;
        db.run('INSERT INTO inquiry_messages (inquiry_id, sender_id, message) VALUES (?, ?, ?)', [newId, client_id, "I'm interested in this vehicle."], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id: newId, success: true, isNew: true });
        });
      });
    }
  });
});

app.get('/api/inquiries', verifyToken, (req, res) => {
  let query = '';
  const params = [];

  if (req.user.role === 'client') {
    query = `SELECT i.*, c.make, c.model, c.year, c.imageUrl FROM inquiries i JOIN cars c ON i.car_id = c.id WHERE i.client_id = ? ORDER BY i.created_at DESC`;
    params.push(req.user.id);
  } else {
    query = `SELECT i.*, c.make, c.model, c.year, u.name as client_name, u.email as client_email FROM inquiries i JOIN cars c ON i.car_id = c.id JOIN users u ON i.client_id = u.id ORDER BY i.created_at DESC`;
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/inquiries/:id/messages', verifyToken, (req, res) => {
  const inquiryId = req.params.id;
  db.get(`SELECT i.*, c.make, c.model, c.year, c.price, c.imageUrl, u.name as client_name 
          FROM inquiries i 
          JOIN cars c ON i.car_id = c.id 
          JOIN users u ON i.client_id = u.id 
          WHERE i.id = ?`, [inquiryId], (err, inquiry) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    if (req.user.role === 'client' && inquiry.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    db.all(`SELECT m.*, u.name as sender_name, u.role as sender_role 
            FROM inquiry_messages m 
            JOIN users u ON m.sender_id = u.id 
            WHERE m.inquiry_id = ? 
            ORDER BY m.created_at ASC`, [inquiryId], (err, messages) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ inquiry, messages });
    });
  });
});

app.post('/api/inquiries/:id/messages', verifyToken, (req, res) => {
  const inquiryId = req.params.id;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  db.get('SELECT * FROM inquiries WHERE id = ?', [inquiryId], (err, inquiry) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    if (req.user.role === 'client' && inquiry.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    db.run('INSERT INTO inquiry_messages (inquiry_id, sender_id, message) VALUES (?, ?, ?)', [inquiryId, req.user.id, message], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: 'Sent' });
    });
  });
});

app.patch('/api/inquiries/:id/status', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), (req, res) => {
  const { status } = req.body;
  if (!['pending', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.run('UPDATE inquiries SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

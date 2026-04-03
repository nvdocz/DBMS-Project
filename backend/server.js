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

// UPDATE a car (CEO, Manager, Marketing)
app.put('/api/cars/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing']), (req, res) => {
  // Use multer only if content-type is multipart (image upload), else use already-parsed JSON body
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('image')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      const { make, model, year, price, description, type } = req.body;
      const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
      const query = 'UPDATE cars SET make=?, model=?, year=?, price=?, description=?, type=?, imageUrl=? WHERE id=?';
      db.run(query, [make, model, year, price, description, type, imageUrl, req.params.id], function(dbErr) {
        if (dbErr) return res.status(500).json({ error: dbErr.message });
        res.json({ success: true });
      });
    });
  } else {
    const { make, model, year, price, description, type } = req.body;
    const query = 'UPDATE cars SET make=?, model=?, year=?, price=?, description=?, type=? WHERE id=?';
    db.run(query, [make, model, year, price, description, type, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  }
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

// PATCH mark contact as read
app.patch('/api/contacts/:id/read', verifyToken, (req, res) => {
  db.run('UPDATE contacts SET is_read = 1 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// DELETE a contact message
app.delete('/api/contacts/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), (req, res) => {
  db.run('DELETE FROM contacts WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// GET all services
app.get('/api/services', verifyToken, (req, res) => {
  const { email } = req.query;
  let query = 'SELECT * FROM services';
  const params = [];
  
  if (req.user.role === 'client') {
    query += ' WHERE email = ?';
    params.push(req.user.email);
  } else if (email) {
    query += ' WHERE email = ?';
    params.push(email);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update Service Status
app.patch('/api/services/:id/status', verifyToken, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Clients can only cancel
  if (req.user.role === 'client' && status !== 'cancelled') {
    return res.status(403).json({ error: 'Clients can only cancel appointments' });
  }

  if (req.user.role === 'client') {
    db.get('SELECT * FROM services WHERE id = ? AND email = ?', [req.params.id, req.user.email], (err, service) => {
       if (err) return res.status(500).json({ error: err.message });
       if (!service) return res.status(403).json({ error: 'Forbidden' });
       db.run('UPDATE services SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
         if (err) return res.status(500).json({ error: err.message });
         res.json({ success: true });
       });
    });
  } else {
    // Admins
    db.run('UPDATE services SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  }
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
  const typeFilter = req.query.type;

  if (req.user.role === 'client') {
    query = `SELECT i.*, c.make, c.model, c.year, c.imageUrl,
      (SELECT COUNT(*) FROM inquiry_messages m
        WHERE m.inquiry_id = i.id
        AND m.sender_id != ?
        AND m.id > COALESCE((SELECT last_read_message_id FROM inquiry_reads WHERE inquiry_id = i.id AND user_id = ?), 0)
      ) as unread_count
      FROM inquiries i JOIN cars c ON i.car_id = c.id WHERE i.client_id = ?`;
    params.push(req.user.id, req.user.id, req.user.id);
  } else {
    query = `SELECT i.*, c.make, c.model, c.year, c.imageUrl, u.name as client_name, u.email as client_email,
      (SELECT COUNT(*) FROM inquiry_messages m
        WHERE m.inquiry_id = i.id
        AND m.sender_id != ?
        AND m.id > COALESCE((SELECT last_read_message_id FROM inquiry_reads WHERE inquiry_id = i.id AND user_id = ?), 0)
      ) as unread_count
      FROM inquiries i JOIN cars c ON i.car_id = c.id JOIN users u ON i.client_id = u.id WHERE 1=1`;
    params.push(req.user.id, req.user.id);
  }

  if (typeFilter) {
    query += ` AND c.type = ?`;
    params.push(typeFilter);
  }

  query += ` ORDER BY i.created_at DESC`;

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
      // Auto mark-as-read for the sender after sending
      const newMsgId = this.lastID;
      db.run(`INSERT INTO inquiry_reads (inquiry_id, user_id, last_read_message_id) VALUES (?, ?, ?)
              ON CONFLICT(inquiry_id, user_id) DO UPDATE SET last_read_message_id = excluded.last_read_message_id`,
        [inquiryId, req.user.id, newMsgId]);
      res.json({ success: true, message: 'Sent' });
    });
  });
});

// Mark all messages in an inquiry as read for the current user
app.post('/api/inquiries/:id/read', verifyToken, (req, res) => {
  const inquiryId = req.params.id;
  db.get('SELECT MAX(id) as max_id FROM inquiry_messages WHERE inquiry_id = ?', [inquiryId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const maxId = row?.max_id || 0;
    db.run(`INSERT INTO inquiry_reads (inquiry_id, user_id, last_read_message_id) VALUES (?, ?, ?)
            ON CONFLICT(inquiry_id, user_id) DO UPDATE SET last_read_message_id = excluded.last_read_message_id`,
      [inquiryId, req.user.id, maxId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
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

app.delete('/api/inquiries/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), (req, res) => {
  db.run('DELETE FROM inquiry_messages WHERE inquiry_id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run('DELETE FROM inquiries WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// --- BOOKINGS ---
app.get('/api/bookings', verifyToken, (req, res) => {
  let query = `
    SELECT b.*, c.make, c.model, c.year, c.price, c.imageUrl, u.name as client_name, u.email as client_email 
    FROM bookings b 
    JOIN cars c ON b.car_id = c.id 
    JOIN users u ON b.client_id = u.id 
  `;
  const params = [];
  
  if (req.user.role === 'client') {
    query += ' WHERE b.client_id = ? ';
    params.push(req.user.id);
  }

  query += ' ORDER BY b.created_at DESC ';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/bookings/check', (req, res) => {
  const { car_id, start_date, end_date } = req.body;
  
  db.all(
    `SELECT start_date, end_date FROM bookings WHERE car_id = ? AND status != 'cancelled'`,
    [car_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const requestedStart = new Date(start_date);
      const requestedEnd = new Date(end_date);
      
      let isAvailable = true;
      let nextAvailableDate = null;
      
      for (let b of rows) {
        if (!b.start_date || !b.end_date) continue;
        const bStart = new Date(b.start_date);
        const bEnd = new Date(b.end_date);
        
        if (requestedEnd >= bStart && requestedStart <= bEnd) {
          isAvailable = false;
          const possibleNext = new Date(bEnd);
          possibleNext.setDate(possibleNext.getDate() + 1);
          if (!nextAvailableDate || possibleNext > nextAvailableDate) {
            nextAvailableDate = possibleNext;
          }
        }
      }
      
      if (isAvailable) {
        res.json({ available: true });
      } else {
        res.json({ available: false, nextAvailableDate: nextAvailableDate ? nextAvailableDate.toISOString().split('T')[0] : null });
      }
    }
  );
});

app.post('/api/bookings', verifyToken, (req, res) => {
  const { car_id, start_date, end_date, total_price } = req.body;
  const client_id = req.user.role === 'client' ? req.user.id : req.body.client_id;
  
  if (!car_id || !client_id || !start_date || !end_date || total_price === undefined) {
    return res.status(400).json({ error: 'All fields required' });
  }

  db.get(
    `SELECT id FROM bookings WHERE car_id = ? AND status != 'cancelled' AND (? <= end_date AND ? >= start_date)`,
    [car_id, start_date, end_date],
    (err, overlap) => {
      if (err) return res.status(500).json({ error: err.message });
      if (overlap) return res.status(400).json({ error: 'Dates are already booked' });
      
      const query = 'INSERT INTO bookings (car_id, client_id, start_date, end_date, total_price) VALUES (?, ?, ?, ?, ?)';
      db.run(query, [car_id, client_id, start_date, end_date, total_price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
      });
    }
  );
});

app.patch('/api/bookings/:id/status', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/bookings/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), (req, res) => {
  db.run('DELETE FROM bookings WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

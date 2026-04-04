require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { verifyToken, hasRole, JWT_SECRET } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('[Cloudinary] cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('[Cloudinary] api_key:', process.env.CLOUDINARY_API_KEY);
console.log('[Cloudinary] api_secret length:', process.env.CLOUDINARY_API_SECRET?.length);

// Multer — memory storage, no local disk writes
const upload = multer({ storage: multer.memoryStorage() });

// Helper: upload buffer to Cloudinary, returns secure URL
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'nvdrive/cars' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

app.use(cors());
app.use(express.json());

// ── AUTH ────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.status === 'blocked') return res.status(403).json({ error: 'Account is blocked' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO users (name, email, password, role, status) VALUES ($1,$2,$3,$4,$5)', [name, email, hashedPassword, 'client', 'active']);
    res.json({ success: true, message: 'Registration successful' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// ── USERS ───────────────────────────────────────────────────────────────────

app.get('/api/users', verifyToken, hasRole(['ceo', 'manager']), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', verifyToken, hasRole(['ceo', 'manager']), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query('INSERT INTO users (name, email, password, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING id', [name, email, hashedPassword, role, 'active']);
    res.json({ id: rows[0].id, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', verifyToken, hasRole(['ceo', 'manager']), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/users/:id/status', verifyToken, hasRole(['ceo', 'manager']), async (req, res) => {
  const { status } = req.body;
  if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CARS ────────────────────────────────────────────────────────────────────

app.get('/api/cars', async (req, res) => {
  const { type, search } = req.query;
  let query = `SELECT id, make, model, year, price, description, "imageUrl", type, status FROM cars WHERE 1=1`;
  const params = [];
  if (type) { params.push(type); query += ` AND type = $${params.length}`; }
  if (search) { params.push(`%${search}%`); query += ` AND (make ILIKE $${params.length} OR model ILIKE $${params.length})`; }
  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cars', verifyToken, hasRole(['ceo', 'manager', 'marketing']), upload.single('image'), async (req, res) => {
  const { make, model, year, price, description, type } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Image file is required' });
  try {
    const imageUrl = await uploadToCloudinary(req.file.buffer);
    const { rows } = await pool.query(
      `INSERT INTO cars (make, model, year, price, description, "imageUrl", type) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [make, model, year, price, description, imageUrl, type]
    );
    res.json({ id: rows[0].id, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/cars/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing']), upload.single('image'), async (req, res) => {
  const { make, model, year, price, description, type } = req.body;
  try {
    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file.buffer);
      await pool.query(`UPDATE cars SET make=$1,model=$2,year=$3,price=$4,description=$5,type=$6,"imageUrl"=$7 WHERE id=$8`,
        [make, model, year, price, description, type, imageUrl, req.params.id]);
    } else {
      await pool.query(`UPDATE cars SET make=$1,model=$2,year=$3,price=$4,description=$5,type=$6 WHERE id=$7`,
        [make, model, year, price, description, type, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/cars/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing']), async (req, res) => {
  try {
    await pool.query('DELETE FROM cars WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CONTACTS ────────────────────────────────────────────────────────────────

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' });
  try {
    const { rows } = await pool.query('INSERT INTO contacts (name, email, message) VALUES ($1,$2,$3) RETURNING id', [name, email, message]);
    res.json({ id: rows[0].id, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/contacts', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/contacts/:id/read', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE contacts SET is_read = TRUE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/contacts/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), async (req, res) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SERVICES ────────────────────────────────────────────────────────────────

app.post('/api/services', async (req, res) => {
  const { name, email, phone, date, type, message } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO services (name, email, phone, date, type, message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [name, email, phone, date, type, message]
    );
    res.json({ id: rows[0].id, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/services', verifyToken, async (req, res) => {
  let query = 'SELECT * FROM services';
  const params = [];
  if (req.user.role === 'client') {
    params.push(req.user.email);
    query += ` WHERE email = $1`;
  } else if (req.query.email) {
    params.push(req.query.email);
    query += ` WHERE email = $1`;
  }
  query += ' ORDER BY created_at DESC';
  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/services/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'progress', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (req.user.role === 'client' && status !== 'cancelled') return res.status(403).json({ error: 'Clients can only cancel appointments' });
  try {
    if (req.user.role === 'client') {
      const { rows } = await pool.query('SELECT * FROM services WHERE id = $1 AND email = $2', [req.params.id, req.user.email]);
      if (!rows[0]) return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('UPDATE services SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── INQUIRIES ───────────────────────────────────────────────────────────────

app.post('/api/inquiries', verifyToken, async (req, res) => {
  const { car_id } = req.body;
  const client_id = req.user.id;
  try {
    const { rows: existing } = await pool.query(
      `SELECT * FROM inquiries WHERE car_id = $1 AND client_id = $2 AND status = 'pending'`,
      [car_id, client_id]
    );
    if (existing[0]) return res.json({ id: existing[0].id, success: true, isNew: false });

    const { rows } = await pool.query('INSERT INTO inquiries (car_id, client_id) VALUES ($1,$2) RETURNING id', [car_id, client_id]);
    const newId = rows[0].id;
    await pool.query('INSERT INTO inquiry_messages (inquiry_id, sender_id, message) VALUES ($1,$2,$3)', [newId, client_id, "I'm interested in this vehicle."]);
    res.json({ id: newId, success: true, isNew: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/inquiries', verifyToken, async (req, res) => {
  const typeFilter = req.query.type;
  const uid = req.user.id;
  let query, params;

  if (req.user.role === 'client') {
    query = `
      SELECT i.*, c.make, c.model, c.year, c."imageUrl",
        (SELECT COUNT(*)::int FROM inquiry_messages m
          WHERE m.inquiry_id = i.id AND m.sender_id != $1
          AND m.id > COALESCE((SELECT last_read_message_id FROM inquiry_reads WHERE inquiry_id = i.id AND user_id = $2), 0)
        ) as unread_count
      FROM inquiries i JOIN cars c ON i.car_id = c.id
      WHERE i.client_id = $3`;
    params = [uid, uid, uid];
  } else {
    query = `
      SELECT i.*, c.make, c.model, c.year, c."imageUrl", u.name as client_name, u.email as client_email,
        (SELECT COUNT(*)::int FROM inquiry_messages m
          WHERE m.inquiry_id = i.id AND m.sender_id != $1
          AND m.id > COALESCE((SELECT last_read_message_id FROM inquiry_reads WHERE inquiry_id = i.id AND user_id = $2), 0)
        ) as unread_count
      FROM inquiries i JOIN cars c ON i.car_id = c.id JOIN users u ON i.client_id = u.id
      WHERE 1=1`;
    params = [uid, uid];
  }

  if (typeFilter) { params.push(typeFilter); query += ` AND c.type = $${params.length}`; }
  query += ' ORDER BY i.created_at DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/inquiries/:id/messages', verifyToken, async (req, res) => {
  const inquiryId = req.params.id;
  try {
    const { rows: inqRows } = await pool.query(
      `SELECT i.*, c.make, c.model, c.year, c.price, c."imageUrl", u.name as client_name
       FROM inquiries i JOIN cars c ON i.car_id = c.id JOIN users u ON i.client_id = u.id
       WHERE i.id = $1`, [inquiryId]
    );
    const inquiry = inqRows[0];
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });
    if (req.user.role === 'client' && inquiry.client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const { rows: messages } = await pool.query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role
       FROM inquiry_messages m JOIN users u ON m.sender_id = u.id
       WHERE m.inquiry_id = $1 ORDER BY m.created_at ASC`, [inquiryId]
    );
    res.json({ inquiry, messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inquiries/:id/messages', verifyToken, async (req, res) => {
  const inquiryId = req.params.id;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  try {
    const { rows: inqRows } = await pool.query('SELECT * FROM inquiries WHERE id = $1', [inquiryId]);
    if (!inqRows[0]) return res.status(404).json({ error: 'Inquiry not found' });
    if (req.user.role === 'client' && inqRows[0].client_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const { rows } = await pool.query(
      'INSERT INTO inquiry_messages (inquiry_id, sender_id, message) VALUES ($1,$2,$3) RETURNING id',
      [inquiryId, req.user.id, message]
    );
    const newMsgId = rows[0].id;
    await pool.query(
      `INSERT INTO inquiry_reads (inquiry_id, user_id, last_read_message_id) VALUES ($1,$2,$3)
       ON CONFLICT (inquiry_id, user_id) DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id`,
      [inquiryId, req.user.id, newMsgId]
    );
    res.json({ success: true, message: 'Sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inquiries/:id/read', verifyToken, async (req, res) => {
  const inquiryId = req.params.id;
  try {
    const { rows } = await pool.query('SELECT MAX(id) as max_id FROM inquiry_messages WHERE inquiry_id = $1', [inquiryId]);
    const maxId = rows[0].max_id || 0;
    await pool.query(
      `INSERT INTO inquiry_reads (inquiry_id, user_id, last_read_message_id) VALUES ($1,$2,$3)
       ON CONFLICT (inquiry_id, user_id) DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id`,
      [inquiryId, req.user.id, maxId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/inquiries/:id/status', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    await pool.query('UPDATE inquiries SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/inquiries/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), async (req, res) => {
  try {
    await pool.query('DELETE FROM inquiry_messages WHERE inquiry_id = $1', [req.params.id]);
    await pool.query('DELETE FROM inquiries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── BOOKINGS ────────────────────────────────────────────────────────────────

app.get('/api/bookings', verifyToken, async (req, res) => {
  let query = `
    SELECT b.*, c.make, c.model, c.year, c.price, c."imageUrl", u.name as client_name, u.email as client_email
    FROM bookings b JOIN cars c ON b.car_id = c.id JOIN users u ON b.client_id = u.id`;
  const params = [];
  if (req.user.role === 'client') { params.push(req.user.id); query += ` WHERE b.client_id = $1`; }
  query += ' ORDER BY b.created_at DESC';
  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings/check', async (req, res) => {
  const { car_id, start_date, end_date } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT start_date, end_date FROM bookings WHERE car_id = $1 AND status != 'cancelled'`, [car_id]
    );
    const reqStart = new Date(start_date);
    const reqEnd = new Date(end_date);
    let isAvailable = true;
    let nextAvailableDate = null;
    for (const b of rows) {
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      if (reqEnd >= bStart && reqStart <= bEnd) {
        isAvailable = false;
        const next = new Date(bEnd);
        next.setDate(next.getDate() + 1);
        if (!nextAvailableDate || next > nextAvailableDate) nextAvailableDate = next;
      }
    }
    res.json({ available: isAvailable, nextAvailableDate: nextAvailableDate ? nextAvailableDate.toISOString().split('T')[0] : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bookings', verifyToken, async (req, res) => {
  const { car_id, start_date, end_date, total_price } = req.body;
  const client_id = req.user.role === 'client' ? req.user.id : req.body.client_id;
  if (!car_id || !client_id || !start_date || !end_date || total_price === undefined) return res.status(400).json({ error: 'All fields required' });
  try {
    const { rows: overlap } = await pool.query(
      `SELECT id FROM bookings WHERE car_id = $1 AND status != 'cancelled' AND ($2 <= end_date AND $3 >= start_date)`,
      [car_id, start_date, end_date]
    );
    if (overlap[0]) return res.status(400).json({ error: 'Dates are already booked' });
    const { rows } = await pool.query(
      'INSERT INTO bookings (car_id, client_id, start_date, end_date, total_price) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [car_id, client_id, start_date, end_date, total_price]
    );
    res.json({ id: rows[0].id, success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/bookings/:id/status', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), async (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/bookings/:id', verifyToken, hasRole(['ceo', 'manager', 'marketing', 'delivery']), async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

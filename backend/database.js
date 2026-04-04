const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        price NUMERIC,
        description TEXT,
        "imageUrl" TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'available'
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL REFERENCES cars(id),
        client_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiry_messages (
        id SERIAL PRIMARY KEY,
        inquiry_id INTEGER NOT NULL REFERENCES inquiries(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiry_reads (
        inquiry_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        last_read_message_id INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (inquiry_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL REFERENCES cars(id),
        client_id INTEGER NOT NULL REFERENCES users(id),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_price NUMERIC NOT NULL,
        status TEXT DEFAULT 'confirmed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await seedUsers(client);
    await seedCars(client);

    console.log('PostgreSQL database initialised.');
  } catch (err) {
    console.error('DB init error:', err.message);
  } finally {
    client.release();
  }
};

async function seedUsers(client) {
  const { rows } = await client.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(rows[0].count) === 0) {
    console.log('Seeding default CEO user...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await client.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['System CEO', 'ceo@nvdrive.com', hashedPassword, 'ceo']
    );
  }
}

async function seedCars(client) {
  const { rows } = await client.query('SELECT COUNT(*) as count FROM cars');
  if (parseInt(rows[0].count) === 0) {
    console.log('Seeding initial car data...');
    const insert = `INSERT INTO cars (make, model, year, price, description, "imageUrl", type) VALUES ($1,$2,$3,$4,$5,$6,$7)`;
    const cars = [
      ['Audi', 'R8 V10', 2023, 160000, 'Stunning Audi R8 in sleek design.', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=800', 'sales'],
      ['Porsche', '911 GT3', 2024, 185000, 'Track-focused performance.', 'https://images.unsplash.com/photo-1503376713356-ab39ad61dbcc?auto=format&fit=crop&q=80&w=800', 'sales'],
      ['Mercedes', 'G-Wagon', 2023, 130000, 'Luxury SUV with premium feel.', 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=800', 'sales'],
      ['Lamborghini', 'Huracan', 2023, 1200, 'Rent by the day. Pure thrill.', 'https://images.unsplash.com/photo-1627454819213-f421f1d18727?auto=format&fit=crop&q=80&w=800', 'rentals'],
      ['Ferrari', 'F8 Tributo', 2022, 1500, 'Experience the Prancing Horse.', 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=80&w=800', 'rentals'],
      ['Tesla', 'Model S Plaid', 2024, 500, 'Electric speed.', 'https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&q=80&w=800', 'rentals'],
    ];
    for (const car of cars) await client.query(insert, car);
  }
}

initDB();

module.exports = pool;

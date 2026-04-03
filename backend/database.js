const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Seed and Create Tables
    db.serialize(() => {
      // Users Table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee', -- 'ceo', 'manager', 'marketing', 'delivery', 'client'
        status TEXT DEFAULT 'active', -- 'active', 'blocked'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (!err) {
          db.run(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`, () => {
             // Ignore error if column already exists
             seedUsers();
          });
        }
      });

      // Cars Table
      db.run(`CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        price REAL,
        description TEXT,
        imageUrl TEXT,
        type TEXT NOT NULL, -- 'sales' or 'rentals'
        status TEXT DEFAULT 'available' -- 'available', 'sold', 'rented'
      )`, (err) => {
         if(!err) seedData();
      });

      // Contacts Table
      db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, () => {
        db.run(`ALTER TABLE contacts ADD COLUMN is_read INTEGER DEFAULT 0`, () => {
          // Ignore if column already exists
        });
      });

      // Services Table
      db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (!err) {
          db.run(`ALTER TABLE services ADD COLUMN status TEXT DEFAULT 'pending'`, () => {
            // Ignore if column already exists
          });
        }
      });

      // Inquiries Table
      db.run(`CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending', -- 'pending' or 'completed'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (car_id) REFERENCES cars (id),
        FOREIGN KEY (client_id) REFERENCES users (id)
      )`);

      // Inquiry Messages Table
      db.run(`CREATE TABLE IF NOT EXISTS inquiry_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inquiry_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inquiry_id) REFERENCES inquiries (id),
        FOREIGN KEY (sender_id) REFERENCES users (id)
      )`);

      // Inquiry Reads Table — tracks last read message per user per inquiry
      db.run(`CREATE TABLE IF NOT EXISTS inquiry_reads (
        inquiry_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        last_read_message_id INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (inquiry_id, user_id)
      )`);

      // Bookings Table
      db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'confirmed', -- 'confirmed', 'completed', 'cancelled'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (car_id) REFERENCES cars (id),
        FOREIGN KEY (client_id) REFERENCES users (id)
      )`);
    });
  }
});

function seedUsers() {
  db.get("SELECT count(*) as count FROM users", (err, row) => {
    if (row && row.count === 0) {
      console.log('Seeding default CEO user...');
      const insert = "INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)";
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      db.run(insert, ["System CEO", "ceo@nvdrive.com", hashedPassword, "ceo"]);
    }
  });
}

function seedData() {
  db.get("SELECT count(*) as count FROM cars", (err, row) => {
    if (row && row.count === 0) {
      console.log('Seeding initial auto data...');
      const insert = "INSERT INTO cars (make, model, year, price, description, imageUrl, type) VALUES (?,?,?,?,?,?,?)";
      db.run(insert, ["Audi", "R8 V10", 2023, 160000, "Stunning Audi R8 in sleek design.", "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=800", "sales"]);
      db.run(insert, ["Porsche", "911 GT3", 2024, 185000, "Track-focused performance.", "https://images.unsplash.com/photo-1503376713356-ab39ad61dbcc?auto=format&fit=crop&q=80&w=800", "sales"]);
      db.run(insert, ["Mercedes", "G-Wagon", 2023, 130000, "Luxury SUV with premium feel.", "https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=800", "sales"]);
      db.run(insert, ["Lamborghini", "Huracan", 2023, 1200, "Rent by the day. Pure thrill.", "https://images.unsplash.com/photo-1627454819213-f421f1d18727?auto=format&fit=crop&q=80&w=800", "rentals"]);
      db.run(insert, ["Ferrari", "F8 Tributo", 2022, 1500, "Experience the Prancing Horse.", "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=80&w=800", "rentals"]);
      db.run(insert, ["Tesla", "Model S Plaid", 2024, 500, "Electric speed.", "https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&q=80&w=800", "rentals"]);
    }
  });
}

module.exports = db;

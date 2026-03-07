const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new Database('wedding.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT
  );
  
  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    name TEXT,
    price INTEGER,
    rating REAL,
    img TEXT,
    description TEXT,
    location TEXT
  );
  
  CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    vendor_name TEXT,
    booking_date TEXT,
    budget INTEGER,
    payment_status TEXT DEFAULT 'pending',
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    user_id INTEGER,
    amount INTEGER,
    method TEXT,
    status TEXT DEFAULT 'success',
    transaction_id TEXT,
    vendor_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

/** API ROUTES **/

// 1. Auth
app.post('/api/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)');
    stmt.run(name, email, phone, password);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ success: false, message: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
  
  if (user) {
    delete user.password; // Don't send password back
    res.json({ success: true, user });
  } else if (email === 'demo@example.com' && password === 'demo123') {
    res.json({ success: true, user: { id: 1, name: 'Demo User', email: 'demo@example.com', phone: '9999999999' } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// 2. Vendors 
// Mocking the vendors array for simplicity. In a real app, populate the vendors table via admin panel.
const MOCK_VENDORS = [
  { id: 1, category: "Venues", name: "Grand Taj Palace", price: 150000, rating: 4.8, location: "Mumbai", img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800" },
  { id: 2, category: "Photography", name: "LensCrafters", price: 50000, rating: 4.9, location: "Delhi", img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800" },
  { id: 3, category: "Catering", name: "Royal Feasts", price: 1000, rating: 4.7, location: "Pune", img: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800" },
  { id: 4, category: "Decorators", name: "Floral Dreams", price: 75000, rating: 4.8, location: "Bangalore", img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800" }
];

app.get('/api/vendors', (req, res) => {
  res.json({ success: true, vendors: MOCK_VENDORS });
});

// 3. Bookings
app.post('/api/bookings', (req, res) => {
  const { userId, vendorName, date, budget } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO bookings (user_id, vendor_name, booking_date, budget) VALUES (?, ?, ?, ?)');
    const info = stmt.run(userId, vendorName, date, budget);
    res.json({ success: true, bookingId: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

app.get('/api/bookings/:userId', (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_id DESC').all(req.params.userId);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve bookings' });
  }
});

// 4. Payments
app.post('/api/payments', (req, res) => {
  const { bookingId, userId, amount, method, vendorName } = req.body;
  const transactionId = 'TXN' + Math.random().toString().slice(2, 10);
  
  try {
    // Save payment
    const paymentStmt = db.prepare('INSERT INTO payments (booking_id, user_id, amount, method, transaction_id, vendor_name) VALUES (?, ?, ?, ?, ?, ?)');
    paymentStmt.run(bookingId, userId, amount, method, transactionId, vendorName);
    
    // Update booking status
    const updateBookingStmt = db.prepare("UPDATE bookings SET payment_status = 'paid' WHERE booking_id = ?");
    updateBookingStmt.run(bookingId);
    
    res.json({ success: true, transactionId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

app.get('/api/payments/:userId', (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});


// Serve React / UI
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Vanilla JS Server/API listening at http://localhost:${port}`);
});

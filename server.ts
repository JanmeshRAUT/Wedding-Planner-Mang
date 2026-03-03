import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("wedding.db");

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    vendor_name TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    budget REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, vendor_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// --- Mock Vendor Data (Indian Context) ---
const MOCK_VENDORS = [
  { 
    id: 1, 
    name: 'Vibrant Visions Photography', 
    category: 'Photographer', 
    rating: 4.9, 
    price: 75000, 
    desc: 'Capturing the essence of Indian weddings with cinematic brilliance.', 
    img: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=600', 
    location: 'Mumbai, Maharashtra',
    email: 'contact@vibrantvisions.in',
    reviews: [
      { user: 'Ananya S.', rating: 5, comment: 'Absolutely amazing work! They captured every emotion perfectly.' },
      { user: 'Rahul M.', rating: 4, comment: 'Great quality, but a bit expensive.' }
    ]
  },
  { 
    id: 2, 
    name: 'Spice Route Catering', 
    category: 'Caterer', 
    rating: 4.8, 
    price: 800, 
    desc: 'Authentic Indian flavors and international cuisines for your grand feast.', 
    img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600', 
    location: 'Delhi, NCR',
    email: 'info@spiceroute.com',
    reviews: [
      { user: 'Priya K.', rating: 5, comment: 'The food was the highlight of our wedding. Everyone loved it!' }
    ]
  },
  { 
    id: 3, 
    name: 'Royal Mandap Decorators', 
    category: 'Decorator', 
    rating: 4.7, 
    price: 150000, 
    desc: 'Traditional and contemporary wedding decor that feels like royalty.', 
    img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=600', 
    location: 'Bangalore, Karnataka',
    email: 'royal@mandap.in',
    reviews: [
      { user: 'Suresh V.', rating: 4, comment: 'Beautiful setup, though they were slightly late for the setup.' }
    ]
  },
  { 
    id: 4, 
    name: 'Shringar Bridal Studio', 
    category: 'Makeup Artist', 
    rating: 4.9, 
    price: 25000, 
    desc: 'Expert bridal makeup and styling for the perfect traditional look.', 
    img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600', 
    location: 'Chennai, Tamil Nadu',
    email: 'shringar@beauty.com',
    reviews: [
      { user: 'Meera R.', rating: 5, comment: 'I felt like a queen! Thank you for the amazing makeover.' }
    ]
  },
  { id: 5, name: 'Eternal Frames', category: 'Photographer', rating: 4.6, price: 60000, desc: 'Candid photography that captures every emotion of your special day.', img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600', location: 'Pune, Maharashtra', email: 'eternal@frames.in', reviews: [] },
  { id: 6, name: 'The Great Indian Kitchen', category: 'Caterer', rating: 4.5, price: 1200, desc: 'Exquisite multi-cuisine catering for weddings and large events.', img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600', location: 'Hyderabad, Telangana', email: 'kitchen@greatindian.com', reviews: [] },
  { id: 7, name: 'Utsav Event Planners', category: 'Decorator', rating: 4.8, price: 250000, desc: 'Bespoke wedding planning and grand venue decorations.', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600', location: 'Jaipur, Rajasthan', email: 'utsav@events.in', reviews: [] },
  { id: 8, name: 'Apsara Beauty Lounge', category: 'Makeup Artist', rating: 4.7, price: 35000, desc: 'Luxury bridal makeovers and pre-wedding grooming services.', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600', location: 'Kolkata, West Bengal', email: 'apsara@beauty.in', reviews: [] },
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // Get Vendors
  app.get("/api/vendors", (req, res) => {
    res.json(MOCK_VENDORS);
  });

  // Registration
  app.post("/api/register", (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)");
      const result = stmt.run(name, email, password, phone);
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message.includes("UNIQUE") ? "Email already exists" : error.message });
    }
  });

  // Login
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Update Profile
  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    try {
      db.prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?").run(name, email, phone, id);
      const user = db.prepare("SELECT id, name, email, phone FROM users WHERE id = ?").get(id);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // Favorites
  app.get("/api/favorites/:userId", (req, res) => {
    const { userId } = req.params;
    const favs = db.prepare("SELECT vendor_id FROM favorites WHERE user_id = ?").all(userId) as any[];
    res.json(favs.map(f => f.vendor_id));
  });

  app.post("/api/favorites", (req, res) => {
    const { userId, vendorId } = req.body;
    try {
      db.prepare("INSERT INTO favorites (user_id, vendor_id) VALUES (?, ?)").run(userId, vendorId);
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false });
    }
  });

  app.delete("/api/favorites", (req, res) => {
    const { userId, vendorId } = req.body;
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND vendor_id = ?").run(userId, vendorId);
    res.json({ success: true });
  });

  // Booking
  app.post("/api/bookings", (req, res) => {
    const { userId, vendorName, date, budget } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO bookings (user_id, vendor_name, booking_date, budget) VALUES (?, ?, ?, ?)");
      const result = stmt.run(userId, vendorName, date, budget);
      res.json({ success: true, bookingId: result.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get User Bookings
  app.get("/api/bookings/:userId", (req, res) => {
    const bookings = db.prepare("SELECT * FROM bookings WHERE user_id = ?").all(req.params.userId);
    res.json(bookings);
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve("dist")));
    app.get("*", (req, res) => res.sendFile(path.resolve("dist/index.html")));
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

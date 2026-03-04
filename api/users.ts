import { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage (note: resets on deployment)
const users: any[] = [];
const bookings: any[] = [];
const favorites: Map<string, number[]> = new Map();
const budgetItems: any[] = [];
const photoGallery: any[] = [];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  if (req.method === 'POST' && action === 'register') {
    const { name, email, password, phone } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const user = { id: users.length + 1, name, email, password, phone };
    users.push(user);
    res.status(200).json({ success: true, userId: user.id });
  } else if (req.method === 'POST' && action === 'login') {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } else if (req.method === 'PUT' && action === 'profile') {
    const { id } = req.query;
    const { name, email, phone } = req.body;
    const user = users.find(u => u.id === parseInt(id as string));
    if (user) {
      user.name = name;
      user.email = email;
      user.phone = phone;
      res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

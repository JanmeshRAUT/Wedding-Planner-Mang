import { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory storage (resets between deployments)
const users: Record<string, any> = {
  'demo@example.com': { id: 1, name: 'Demo User', email: 'demo@example.com', password: 'demo123', phone: '9999999999' }
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // This route handles /api/register, /api/login, /api/users/:id endpoints
  const path = req.url?.split('?')[0] || '';
  
  if (req.method === 'POST' && path.includes('/register')) {
    // Register
    const { name, email, password, phone } = req.body;
    if (users[email]) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    users[email] = {
      id: Object.keys(users).length + 1,
      name,
      email,
      password,
      phone
    };
    res.status(200).json({ success: true, userId: users[email].id });
  } else if (req.method === 'POST' && path.includes('/login')) {
    // Login
    const { email, password } = req.body;
    const user = users[email];
    if (user && user.password === password) {
      res.status(200).json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } else if (req.method === 'PUT' && path.includes('/users/')) {
    // Update profile
    const userId = path.split('/users/')[1]?.split('/')[0];
    const { name, email, phone } = req.body;
    
    // Find user by id
    let user = Object.values(users).find((u: any) => u.id === parseInt(userId));
    if (user) {
      user.name = name;
      user.email = email;
      user.phone = phone;
      // Update key in users object if email changed
      delete users[Object.keys(users).find(key => users[key].id === user.id)!];
      users[email] = user;
      res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}


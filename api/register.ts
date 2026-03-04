import { VercelRequest, VercelResponse } from '@vercel/node';

const users: Record<string, any> = {};

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { name, email, password, phone } = req.body;
    if (users[email]) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    users[email] = { id: Object.keys(users).length + 1, name, email, password, phone };
    res.status(200).json({ success: true, userId: users[email].id });
  } else {
    res.status(405).json({ success: false });
  }
}

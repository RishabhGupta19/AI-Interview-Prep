import jwt from 'jsonwebtoken';
import User from '../models/User.js';


export default async function auth(req, res, next) {
try {
const header = req.headers.authorization || '';
const token = header.replace('Bearer ', '');
if (!token) return res.status(401).json({ error: 'No token' });


const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(decoded.userId).select('-passwordHash');
if (!user) return res.status(401).json({ error: 'User not found' });


req.user = user;
next();
} catch (err) {
console.error('Auth middleware error', err.message);
return res.status(401).json({ error: 'Invalid token' });
}
}
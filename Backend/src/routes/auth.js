import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';


const router = express.Router();


router.post('/signup', async (req, res) => {
try {
const {name, email, password } = req.body;
console.log(req.body);
if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

// if(email || password) return res.status(200).json({message:'Account created'});
const existing = await User.findOne({ email });
if (existing) return res.status(400).json({ message: 'User exists' });


const passwordHash = await bcrypt.hash(password, 10);
const user = await User.create({ name, email, passwordHash });


const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
res.json({ token, user: { id: user._id, email: user.email } });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});


router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
const user = await User.findOne({ email });
if (!user) return res.status(401).json({ message: 'Invalid credentials' });


const match = await bcrypt.compare(password, user.passwordHash);
if (!match) return res.status(401).json({ message: 'Invalid credentials' });


const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
res.json({ token, user: {name:user.name, id: user._id, email: user.email } });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Server error' });
}
});


export default router;
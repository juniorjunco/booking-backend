require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');

const bookingRoutes = require('./routes/bookings');
const availabilityRoutes = require('./routes/availability');

const app = express();

app.use(cors({
  origin: 'https://latinosdetailing.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB connection (only once in serverless)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
}

// Middleware auth
const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';
const ADMIN_EMAIL = 'admin@latinos.com';
const ADMIN_PASSWORD = 'adminjesusayala';

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '4h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// Pre-conexión a Mongo
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);

// Export for Vercel
module.exports = app;

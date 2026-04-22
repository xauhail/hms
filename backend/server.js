require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/hms', require('./routes/hms'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SmartHotel HMS API', version: '1.0.0', time: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  console.log(`\n🏨 SmartHotel HMS API running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`💳 Billing: http://localhost:${PORT}/api/billing`);
  console.log(`🏠 HMS: http://localhost:${PORT}/api/hms\n`);
});

module.exports = app;

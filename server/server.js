require('dotenv').config({ path: require('path').join(__dirname, '.env') });
console.log('🔧 ENV variables:', { MONGODB_URI: process.env.MONGODB_URI, JWT_SECRET: process.env.JWT_SECRET, CLIENT_URL: process.env.CLIENT_URL });
console.log('🔧 ENV MONGODB_URI:', process.env.MONGODB_URI);
// Validate required environment variables at startup
const requiredEnv = ['JWT_SECRET', 'CLIENT_URL'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { sendSuccess, sendError } = require('./src/utils/responseFormatter');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');
const officerRoutes = require('./src/routes/officerRoutes');
const noticeRoutes = require('./src/routes/noticeRoutes');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middlewares
app.use(helmet());
// CORS Configuration – only allow origins defined in CLIENT_URL env variable (comma‑separated list)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];
// Add any additional origins from CLIENT_URL (comma‑separated) or VERCEL_URL
if (process.env.CLIENT_URL) {
  const extra = process.env.CLIENT_URL.split(',').map(o => o.trim()).filter(Boolean);
  allowedOrigins.push(...extra);
}
if (process.env.VERCEL_URL) {
  const vercelDomain = process.env.VERCEL_URL.startsWith('http')
    ? process.env.VERCEL_URL
    : `https://${process.env.VERCEL_URL}`;
  allowedOrigins.push(vercelDomain);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      } else {
        return callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// General API Rate Limiter (300 requests per 15 minutes per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// Strict Rate Limiter for Authentication (10 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 1. Health check endpoint (Public)
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  return sendSuccess(res, 'CampusHire API is healthy and operational', {
    server: 'Running',
    database: statusMap[dbStatus] || 'Unknown',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/notices', noticeRoutes);

// Handle unknown API endpoints
app.use('*', (req, res) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[CampusHire Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server };


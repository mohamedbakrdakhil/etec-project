const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // disabled to allow React frontend
  crossOriginEmbedderPolicy: false,
}));

// CORS - restrict to known origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://etec-fez.vercel.app', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Limit JSON payload size
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// XSS protection: strip dangerous patterns from request body and query
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/<script[^>]*?>.*?<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    });
  };
  sanitize(req.body);
  sanitize(req.query);
  next();
});

// General rate limiter for all API routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes, veuillez réessayer dans 15 minutes.' },
});

app.use('/api', generalLimiter);

// API Routes
app.use('/api', apiRoutes);

// Serve Frontend (production)
app.use(express.static(path.join(__dirname, '../../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║     🎓 ETEC Server démarré          ║
║     Port: ${PORT}                      ║
║     Mode: ${process.env.NODE_ENV || 'development'}            ║
╚══════════════════════════════════════╝
  `);
});

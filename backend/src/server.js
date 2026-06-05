const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();

// Compression GZIP - réduit la taille des réponses de 60-80%
app.use(compression());

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

// General rate limiter - 500 req/15min par IP (suffisant pour usage normal)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,                  // 200 → 500 pour ne pas bloquer les vrais users
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {           // ne pas limiter les requêtes GET (lecture seule)
    return req.method === 'GET';
  },
  message: { message: 'Trop de requêtes, veuillez réessayer dans quelques minutes.' },
});

app.use('/api', generalLimiter);

// Cache-Control pour les endpoints de lecture fréquente
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    // données qui changent rarement: 30 secondes de cache
    res.set('Cache-Control', 'private, max-age=30');
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Serve Frontend only if build folder exists (not on Railway when frontend is on Vercel)
const frontendBuild = path.join(__dirname, '../../frontend/build');
const fs = require('fs');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.json({ status: 'ETEC API running', version: '1.0.0' }));
}

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

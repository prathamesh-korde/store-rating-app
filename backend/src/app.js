'use strict';
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Routers
const authRouter = require('./modules/auth/auth.router');
const usersRouter = require('./modules/users/users.router');
const storesRouter = require('./modules/stores/stores.router');
const ratingsRouter = require('./modules/ratings/ratings.router');

const app = express();

// ── Security Middleware ──────────────────────────────────────
app.use(helmet());

// ── Dynamic CORS origin list ─────────────────────────────────
// Accepts: the configured CLIENT_ORIGIN, all *.vercel.app previews, and localhost
const allowedOrigins = [
  env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Render health checks, mobile)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain (covers preview deployments too)
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    // Allow onrender.com for internal calls
    if (/\.onrender\.com$/.test(origin)) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight for all routes

// Rate limit auth login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Parsers ──────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Routes ───────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, loginLimiter, authRouter);    // rate-limited on login
app.use(`${API}/admin`, usersRouter);
app.use(`${API}`, storesRouter);
app.use(`${API}`, ratingsRouter);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Cannot ${req.method} ${req.path}` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;

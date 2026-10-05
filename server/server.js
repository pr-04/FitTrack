const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const MongoStore = require('connect-mongo').default;
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiters');

// Load .env from server/ directory regardless of where npm is run from
dotenv.config({ path: path.join(__dirname, '.env') });

// Production environment variable check
if (process.env.NODE_ENV === 'production') {
    const missing = [];
    if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
    if (!process.env.SESSION_SECRET) missing.push('SESSION_SECRET');
    if (!process.env.MONGO_URI) missing.push('MONGO_URI');
    if (missing.length > 0) {
        console.error(`[CRITICAL ERROR] Missing required environment variables in production: ${missing.join(', ')}`);
        process.exit(1);
    }
}

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
        console.error('[CRITICAL ERROR] SESSION_SECRET is required in production.');
        process.exit(1);
    }
    sessionSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[SECURITY WARNING] SESSION_SECRET not set in environment. Generated random session secret for development.');
}

// Connect to MongoDB
connectDB();

// Configure Passport strategies
require('./config/passport');

const app = express();

// Trust proxy for Render reverse proxy (ensures correct IP for rate limiting)
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.googleusercontent.com", "https://images.unsplash.com"],
            connectSrc: [
                "'self'",
                "https://accounts.google.com"
            ],
            frameSrc: ["'self'", "https://accounts.google.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Allowlist
const allowedOrigins = [];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}
if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
        const trimmed = origin.trim();
        if (trimmed && !allowedOrigins.includes(trimmed)) {
            allowedOrigins.push(trimmed);
        }
    });
}
if (process.env.NODE_ENV !== 'production') {
    ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'].forEach(loc => {
        if (!allowedOrigins.includes(loc)) {
            allowedOrigins.push(loc);
        }
    });
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sanitize against NoSQL injection
app.use(mongoSanitize());

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// Session (required by Passport for OAuth flow even with session:false on callback)
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60 // 14 days
    })
}));
app.use(passport.initialize());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/workout', require('./routes/workoutRoutes'));
app.use('/api/diet', require('./routes/dietRoutes'));
app.use('/api/tracker', require('./routes/trackerRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'FitTrack API is running 🚀' });
});

// Unknown /api route handler (returns JSON 404)
app.use('/api', notFound);

// ─── Static File Serving ──────────────────────────────────────────────────────
const clientPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientPath));

// Catch-all route for SPA — non-/api GET requests only
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(clientPath, 'index.html'));
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

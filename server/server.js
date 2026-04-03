const express = require('express'); // Restarted to reload .env and connect to MongoDB Atlas
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');
const MongoStore = require('connect-mongo').default;
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load .env from server/ directory regardless of where npm is run from
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

// Configure Passport strategies
require('./config/passport');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://fit-track-phi-virid.vercel.app',
  'https://fit-track-priyanshu-ranjans-projects.vercel.app'
].filter(Boolean); // Filter out undefined if CLIENT_URL is not set

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps/Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin is in our allowed list or matches a Vercel preview pattern
    const isAllowed = allowedOrigins.includes(origin) || 
                     (origin.startsWith('https://fit-track') && origin.endsWith('vercel.app'));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session (required by Passport for OAuth flow even with session:false on callback)
app.use(session({
    secret: process.env.SESSION_SECRET || 'fittrack_session_secret_123',
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

// ─── Static File Serving ──────────────────────────────────────────────────────
const clientPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientPath));

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

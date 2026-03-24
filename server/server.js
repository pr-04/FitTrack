const express = require('express'); // Restarted to reload .env and connect to MongoDB Atlas
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');
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
  'https://fit-track-phi-virid.vercel.app',
  'https://fit-track-priyanshu-ranjans-projects.vercel.app'
];

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
}));
app.use(passport.initialize());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workouts', require('./routes/workoutRoutes'));
app.use('/api/foods', require('./routes/foodRoutes'));
app.use('/api/weights', require('./routes/weightRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'FitTrack API is running 🚀' });
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

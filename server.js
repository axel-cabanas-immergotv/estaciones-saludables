// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Import database
const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const storyRoutes = require('./routes/story');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
    },
  },
}));

// Rate limiting with JSON response
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from src directory (for development)
// This allows loading plugin files directly from src/
app.use('/src', express.static(path.join(__dirname, 'src')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/upload', uploadRoutes);


app.get('/restart-database', async (req, res) => {
  await restartDatabase();
  res.send('Database restarted successfully.');
});

// Home route and catch-all for pages (but not for static files)
app.get('*', (req, res, next) => {
  // Don't serve index.html for static file requests
  if (req.path.includes('.') || req.path.startsWith('/src/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

async function restartDatabase() {
  await sequelize.sync({ force: true });
  // Initialize default data
  initializeDefaultData();
  console.log('Database synced successfully.');
}

// Database sync and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
}

startServer(); 
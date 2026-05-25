const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const aiRoutes = require('./routes/ai.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const careerRoutes = require('./routes/career.routes');

const app = express();

// Initialize cron service for scheduling
const cron = require('node-cron');
const { runScheduledTasks } = require('./services/cron.service');
cron.schedule('* * * * *', runScheduledTasks);
console.log('⏰ Scheduled posts cron service initialized locally (runs every minute).');

// ========================
// Global Middleware
// ========================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalIp = !origin || /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
      if (isLocalIp || origin === config.clientUrl) {
        callback(null, true);
      } else {
        callback(null, config.clientUrl);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});
app.use('/api/', limiter);

// Stricter rate limit for AI generation
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'AI generation rate limit reached. Please wait a moment.',
  },
});
app.use('/api/ai/', aiLimiter);

// ========================
// Routes
// ========================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/career', careerRoutes);

// ========================
// Error Handling
// ========================
app.use(notFoundHandler);
app.use(errorHandler);

// ========================
// Start Server
// ========================
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   🚀 LinkedIn AI Platform API                    ║
  ║                                                  ║
  ║   Server:  http://localhost:${PORT}                ║
  ║   Health:  http://localhost:${PORT}/api/health     ║
  ║   Env:     ${config.nodeEnv.padEnd(20)}           ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});

module.exports = app;

// Trigger reload

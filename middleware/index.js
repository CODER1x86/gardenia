// middleware.js

// Authentication middleware
const authMiddleware = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Request logging middleware
const logRequests = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = {
  authMiddleware,
  logRequests,
  errorHandler
};
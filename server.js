const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const { logRequests, errorHandler } = require('./middleware');
const authRoutes = require('./authRoutes');
const paymentRoutes = require('./paymentRoutes');
const unitRoutes = require('./unitRoutes');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

// Log all requests
app.use(logRequests);

// Serve static files from the 'public' and 'js' directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Use the routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/units', unitRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
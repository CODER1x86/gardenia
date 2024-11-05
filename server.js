const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const authRoutes = require('./authRoutes');
const paymentRoutes = require('./paymentRoutes');
const unitRoutes = require('./unitRoutes');
const { authMiddleware } = require('./middleware'); // Import the middleware
const app = express();
const PORT = process.env.PORT || 3000;

// Use middleware to protect routes
app.use('/api/expenses', authMiddleware);
app.use('/api/expense-input', authMiddleware);
app.use('/api/edit-expense', authMiddleware);
app.use('/api/delete-expense', authMiddleware);
app.use('/api/revenues', authMiddleware);
app.use('/api/revenue-input', authMiddleware);
app.use('/api/profile', authMiddleware);
app.use('/api/style-settings', authMiddleware);
// Add other routes that require authentication as needed

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Database setup
const db = new sqlite3.Database('./.data/database.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to database');
  }
});

// Use the routes
app.use('/api', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', unitRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Routes for user authentication and profile management
app.post('/api/register', authRoutes);
app.post('/api/login', authRoutes);
app.post('/api/logout', authRoutes);
app.get('/api/check-auth', authRoutes);
app.get('/api/profile', authRoutes);
app.post('/api/profile', authRoutes);

// Routes for payment and expense management
app.use('/api', paymentRoutes);
app.use('/api', unitRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

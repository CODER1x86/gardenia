const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to database');
  }
});
// User registration route
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

// User login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.user = row;
    res.json({ message: 'Login successful', username: row.username });
  });
});

// User logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check authentication status
app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, username: req.session.user.username });
  } else {
    res.json({ authenticated: false });
  }
});
// Get all expenses
app.get('/api/expenses', (req, res) => {
  db.all('SELECT * FROM expenses', (err, rows) => {
    if (err) {
      console.error('Database error:', err);  // Enhanced logging
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows);
  });
});

// Add a new expense
app.post('/api/expense-input', (req, res) => {
  const { category, item, amount, payment_date } = req.body;
  db.run('INSERT INTO expenses (category, item, price, expense_date) VALUES (?, ?, ?, ?)', [category, item, amount, payment_date], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Expense added successfully' });
  });
});

// Edit an existing expense
app.post('/api/edit-expense/:id', (req, res) => {
  const { category, item, price, expense_date } = req.body;
  db.run('UPDATE expenses SET category = ?, item = ?, price = ?, expense_date = ? WHERE expense_id = ?', [category, item, price, expense_date, req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Expense updated successfully' });
  });
});

// Delete an expense
app.post('/api/delete-expense/:id', (req, res) => {
  db.run('DELETE FROM expenses WHERE expense_id = ?', [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Expense deleted successfully' });
  });
});

// Get all revenues
app.get('/api/revenues', (req, res) => {
  db.all('SELECT * FROM revenues', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add a new revenue
app.post('/api/revenue-input', (req, res) => {
  const { unit_number, amount, payment_date, payment_method } = req.body;
  db.run('INSERT INTO revenues (unit_number, amount, payment_date, payment_method) VALUES (?, ?, ?, ?)', [unit_number, amount, payment_date, payment_method], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Revenue added successfully' });
  });
});
// Get user profile
app.get('/api/profile', (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  db.get('SELECT first_name, last_name, birthdate, email FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(row);
  });
});

// Update user profile
app.post('/api/profile', (req, res) => {
  const userId = req.session.user?.id;
  const { first_name, last_name, birthdate, email } = req.body;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  db.run('UPDATE users SET first_name = ?, last_name = ?, birthdate = ?, email = ? WHERE id = ?', [first_name, last_name, birthdate, email, userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Profile updated successfully' });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

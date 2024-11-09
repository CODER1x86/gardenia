// authRoutes.js

const express = require('express');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const db = require('./sqlite');
const { userValidationRules } = require('./js/core/validation');
const router = express.Router();

// Register route
router.post('/register', userValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.dbRun("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed. Please try again later." });
  }
});

// Login route
router.post('/login', userValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  try {
    const user = await db.dbQuery("SELECT * FROM users WHERE username = ?", [username]);
    if (user.length > 0 && await bcrypt.compare(password, user[0].password)) {
      req.session.userId = user[0].id;
      req.session.username = user[0].username;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid credentials." });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ error: "Logout failed. Please try again later." });
    }
    res.json({ success: true });
  });
});

// Check authentication status
router.get('/check-auth', (req, res) => {
  if (req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
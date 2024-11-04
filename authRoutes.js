//authRoutes.js

const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('./sqlite');
const router = express.Router();

router.post('/register', [
  body('username').notEmpty().isString(),
  body('password').notEmpty().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  try {
    await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Registration failed." });
  }
});
router.post('/login', [
  body('username').notEmpty().isString(),
  body('password').notEmpty().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  try {
    const user = await db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
    if (user) {
      req.session.userId = user.id;
      req.session.username = user.username;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid credentials." });
    }
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/check-auth', (req, res) => {
  if (req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;

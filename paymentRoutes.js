//paymentRoutes.js

const express = require('express');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./.data/database.db');
const { authMiddleware } = require('./middleware');
const router = express.Router();

// Public endpoint for fetching expenses
router.get('/expenses', (req, res) => {
  db.all('SELECT * FROM expenses', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Public endpoint for fetching revenues
router.get('/revenues', (req, res) => {
  db.all('SELECT * FROM revenues', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Add a new expense (protected route)
router.post('/expense-input', authMiddleware, [
  body('unit_id').isInt(),
  body('category').notEmpty().isString(),
  body('item').notEmpty().isString(),
  body('price').isFloat(),
  body('expense_date').isISO8601(),
  body('receipt_photo').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { unit_id, category, item, price, expense_date, receipt_photo } = req.body;
  try {
    await db.run(
      "INSERT INTO expenses (unit_id, category, item, price, expense_date, last_updated, receipt_photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [unit_id, category, item, price, expense_date, new Date().toISOString(), receipt_photo]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a new revenue (protected route)
router.post('/revenue-input', authMiddleware, [
  body('unit_id').isInt(),
  body('amount').isFloat(),
  body('payment_date').isISO8601(),
  body('method_id').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { unit_id, amount, payment_date, method_id } = req.body;
  try {
    await db.run(
      "INSERT INTO revenue (unit_id, amount, payment_date, method_id) VALUES (?, ?, ?, ?)",
      [unit_id, amount, payment_date, method_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Edit an existing expense (protected route)
router.post("/edit-expense/:expense_id", authMiddleware, async (req, res) => {
  const { expense_id } = req.params;
  const { category, item, price, expense_date } = req.body;
  try {
    await db.updateExpense(expense_id, category, item, price, expense_date);
    res.json({ message: "Expense updated successfully." });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense." });
  }
});

// Edit an existing revenue (protected route)
router.post("/edit-revenue/:revenue_id", authMiddleware, async (req, res) => {
  const { revenue_id } = req.params;
  const { unit_id, amount, payment_date, method_id } = req.body;
  try {
    await db.run(
      "UPDATE revenue SET unit_id = ?, amount = ?, payment_date = ?, method_id = ? WHERE revenue_id = ?",
      [unit_id, amount, payment_date, method_id, revenue_id]
    );
    res.json({ message: "Revenue updated successfully." });
  } catch (error) {
    console.error("Error updating revenue:", error);
    res.status(500).json({ error: "Failed to update revenue." });
  }
});

// Delete an existing revenue (protected route)
router.post("/delete-revenue/:revenue_id", authMiddleware, async (req, res) => {
  const { revenue_id } = req.params;
  try {
    await db.run("DELETE FROM revenue WHERE revenue_id = ?", [revenue_id]);
    res.json({ message: "Revenue deleted successfully." });
  } catch (error) {
    console.error("Error deleting revenue:", error);
    res.status(500).json({ error: "Failed to delete revenue." });
  }
});

module.exports = router;

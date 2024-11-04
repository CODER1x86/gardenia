const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('./sqlite');
const router = express.Router();

router.post('/expense-input', [
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

router.post('/revenue-input', [
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

// Edit Expense Route
router.post("/edit-expense/:expense_id", async (req, res) => {
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

// Delete Expense Route
router.post("/delete-expense/:expense_id", async (req, res) => {
  const { expense_id } = req.params;
  try {
    await db.deleteExpense(expense_id);
    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense." });
  }
});

module.exports = router;

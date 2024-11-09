// paymentRoutes.js

const express = require('express');
const { validationResult } = require('express-validator');
const db = require('./sqlite');
const { authMiddleware } = require('./middleware');
const { buildDynamicQuery } = require('./js/core/utils');
const { expenseValidationRules, revenueValidationRules } = require('./js/core/validation');
const router = express.Router();

// Public endpoint for fetching expenses
router.get("/expenses", async (req, res) => {
  const { year, month, category, unitNumber, floor } = req.query;
  const baseQuery = "SELECT * FROM expenses WHERE 1=1";
  const { query, params } = buildDynamicQuery(baseQuery, {
    year,
    month,
    category,
    unitNumber,
    floor,
  });

  try {
    const rows = await db.dbQuery(query.replace("date_column", "expense_date"), params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: err.message });
  }
});

// Public endpoint for fetching revenues
router.get("/revenues", async (req, res) => {
  const { year, month, unitNumber, floor } = req.query;
  const baseQuery = "SELECT * FROM revenue WHERE 1=1";
  const { query, params } = buildDynamicQuery(baseQuery, {
    year,
    month,
    unitNumber,
    floor,
  });

  try {
    const rows = await db.dbQuery(query.replace("date_column", "payment_date"), params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching revenues:", err);
    res.status(500).json({ error: err.message });
  }
});

// Public endpoint for fetching total expenses
router.get("/expenses-sum", async (req, res) => {
  const { year, month, category, unitNumber, floor } = req.query;
  const baseQuery = "SELECT COALESCE(SUM(price), 0) AS totalExpenses FROM expenses WHERE 1=1";
  const { query, params } = buildDynamicQuery(baseQuery, {
    year,
    month,
    category,
    unitNumber,
    floor,
  });

  try {
    const rows = await db.dbQuery(query.replace("date_column", "expense_date"), params);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching total expenses:", err);
    res.status(500).json({ error: err.message });
  }
});

// Public endpoint for fetching total revenue
router.get("/revenues-sum", async (req, res) => {
  const { year, month, unitNumber, floor } = req.query;
  const baseQuery = "SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM revenue WHERE 1=1";
  const { query, params } = buildDynamicQuery(baseQuery, {
    year,
    month,
    unitNumber,
    floor,
  });

  try {
    const rows = await db.dbQuery(query.replace("date_column", "payment_date"), params);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching total revenue:", err);
    res.status(500).json({ error: err.message });
  }
});

// Public endpoint for fetching available balance
router.get("/balance", async (req, res) => {
  const { year, month, floor } = req.query;
  try {
    const startingBalance = await db.getStartingBalance(year);
    const revenueQuery = buildDynamicQuery(
      "SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM revenue WHERE 1=1",
      { year, month, floor }
    );
    const totalRevenue = (await db.dbQuery(revenueQuery.query.replace("date_column", "payment_date"), revenueQuery.params))[0].totalRevenue || 0;

    const expenseQuery = buildDynamicQuery(
      "SELECT COALESCE(SUM(price), 0) AS totalExpenses FROM expenses WHERE 1=1",
      { year, month, floor }
    );
    const totalExpenses = (await db.dbQuery(expenseQuery.query.replace("date_column", "expense_date"), expenseQuery.params))[0].totalExpenses || 0;

    const availableBalance = startingBalance + totalRevenue - totalExpenses;
    res.json({ availableBalance });
  } catch (error) {
    console.error("Error fetching available balance:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new expense (protected route)
router.post("/expense-input", authMiddleware, expenseValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { unit_id, category, item, price, expense_date, receipt_photo } = req.body;
  try {
    await db.dbRun(
      "INSERT INTO expenses (unit_id, category, item, price, expense_date, last_updated, receipt_photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [unit_id, category, item, price, expense_date, new Date().toISOString(), receipt_photo]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a new revenue (protected route)
router.post("/revenue-input", authMiddleware, revenueValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { unit_id, amount, payment_date, method_id } = req.body;
  try {
    await db.dbRun(
      "INSERT INTO revenue (unit_id, amount, payment_date, method_id) VALUES (?, ?, ?, ?)",
      [unit_id, amount, payment_date, method_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding revenue:", error);
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
    await db.dbRun(
      "UPDATE revenue SET unit_id = ?, amount = ?, payment_date = ?, method_id = ? WHERE revenue_id = ?",
      [unit_id, amount, payment_date, method_id, revenue_id]
    );
    res.json({ message: "Revenue updated successfully." });
  } catch (error) {
    console.error("Error updating revenue:", error);
    res.status(500).json({ error: "Failed to update revenue." });
  }
});

// Delete an existing expense (protected route)
router.post("/delete-expense/:expense_id", authMiddleware, async (req, res) => {
  const { expense_id } = req.params;
  try {
    await db.deleteExpense(expense_id);
    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense." });
  }
});

// Delete an existing revenue (protected route)
router.post("/delete-revenue/:revenue_id", authMiddleware, async (req, res) => {
  const { revenue_id } = req.params;
  try {
    await db.dbRun("DELETE FROM revenue WHERE revenue_id = ?", [revenue_id]);
    res.json({ message: "Revenue deleted successfully." });
  } catch (error) {
    console.error("Error deleting revenue:", error);
    res.status(500).json({ error: "Failed to delete revenue." });
  }
});

module.exports = router;
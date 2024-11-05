// paymentRoutes.js

const express = require('express');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./.data/database.db');
const { authMiddleware } = require('./middleware');
const router = express.Router();

const buildDynamicQuery = (baseQuery, filters) => {
  let query = baseQuery;
  const params = [];

  Object.keys(filters).forEach((key) => {
    if (filters[key]) {
      switch (key) {
        case 'year':
          query += " AND strftime('%Y', date_column) = ?";
          params.push(filters.year);
          break;
        case 'month':
          query += " AND strftime('%m', date_column) = ?";
          params.push(filters.month);
          break;
        case 'category':
          query += " AND category = ?";
          params.push(filters.category);
          break;
        case 'unitNumber':
          query += " AND unit_id = ?";
          params.push(filters.unitNumber);
          break;
        case 'floor':
          query += " AND floor = ?";
          params.push(filters.floor);
          break;
      }
    }
  });

  return { query, params };
};
// Public endpoint for fetching expenses
router.get('/expenses', (req, res) => {
  const { year, month, category, unitNumber, floor } = req.query;
  const baseQuery = "SELECT * FROM expenses WHERE 1=1";
  const { query, params } = buildDynamicQuery(baseQuery, { year, month, category, unitNumber, floor });
  
  db.all(query.replace('date_column', 'expense_date'), params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Public endpoint for fetching revenues
router.get('/revenues', (req, res) => {
  const { year, month, unitNumber, floor } = req.query;
  const baseQuery = "SELECT * FROM revenue WHERE 1=1";
  const { query, params } = buildDynamicQuery(baseQuery, { year, month, unitNumber, floor });
  
  db.all(query.replace('date_column', 'payment_date'), params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});
// Public endpoint for fetching total expenses for a given year/month/category/unit number/floor
router.get('/expenses-sum', (req, res) => {
  const { year, month, category, unitNumber, floor } = req.query;
  const baseQuery = "SELECT COALESCE(SUM(price), 0) AS totalExpenses FROM expenses WHERE 1=1";
  const { query, params } = buildDynamicQuery(baseQuery, { year, month, category, unitNumber, floor });
  
  db.all(query.replace('date_column', 'expense_date'), params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows[0]);
  });
});

// Public endpoint for fetching total revenue for a given year/month/unit number/floor
router.get('/revenues-sum', (req, res) => {
  const { year, month, unitNumber, floor } = req.query;
  const baseQuery = "SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM revenue WHERE 1=1";
  const { query, params } = buildDynamicQuery(baseQuery, { year, month, unitNumber, floor });
  
  db.all(query.replace('date_column', 'payment_date'), params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows[0]);
  });
});
// Public endpoint for fetching available balance for a given year/month/floor
router.get('/balance', async (req, res) => {
  const { year, month, floor } = req.query;
  try {
    const startingBalance = await getStartingBalance(year);
    const revenueQuery = buildDynamicQuery(
      "SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM revenue WHERE 1=1", 
      { year, month, floor }
    );
    const totalRevenue = (await dbQuery(revenueQuery.query.replace('date_column', 'payment_date'), revenueQuery.params))[0].totalRevenue || 0;

    const expenseQuery = buildDynamicQuery(
      "SELECT COALESCE(SUM(price), 0) AS totalExpenses FROM expenses WHERE 1=1",
      { year, month, floor }
    );
    const totalExpenses = (await dbQuery(expenseQuery.query.replace('date_column', 'expense_date'), expenseQuery.params))[0].totalExpenses || 0;

    const availableBalance = startingBalance + totalRevenue - totalExpenses;
    res.json({ availableBalance });
  } catch (error) {
    console.error('Error fetching available balance:', error);
    res.status(500).json({ error: error.message });
  }
});

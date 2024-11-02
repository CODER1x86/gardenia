// server.js

// 1. Import and Initialize Dependencies
const express = require("express");
const path = require("path");
const {
  initializeDatabase,
  getDb,
  getRevenue,
  getExpensesSum,
  getInventory,
  addInventoryItem,
  getStartingBalance,
  calculateAndInsertBalance,
  getExpenses // Added to fetch all expenses
} = require("./sqlite.js");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
require("dotenv").config();
const bodyParser = require("body-parser");
const app = express();

// 2. Middleware Setup
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "a super secret key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 4 * 60 * 60 * 1000, // Session duration of 4 hours
    },
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// 3. Protect Specific Routes (requires authentication)
function ensureAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect("/login.html");
  }
}

// Protected Routes
app.get("/dashboard.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// 4. Setup Email Transport
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 5. Database Initialization and Root Route
initializeDatabase().then(() => {
  global.db = getDb();
  console.log("Database initialized.");
  
  // Serve Root Route
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
  
  // Serve Static Pages
  const pages = [
    "index.html",
    "budget-summary.html",
    "budget-details.html",
    "expense-report.html",
    "revenue-report.html",
    "login.html",
    "forget-password.html",
    "header.html",
    "footer.html",
    "footer-settings.html",
    "style-modifier.html",
    "inventory-management.html",
  ];
  pages.forEach((page) => {
    app.get(`/${page}`, (req, res) => {
      res.sendFile(path.join(__dirname, "public", page));
    });
  });
});

// 6. API Endpoints for Data Retrieval and Calculations

// Retrieve Budget Data
app.get("/api/data", ensureAuthenticated, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const totalRevenue = (await getRevenue(year)).totalRevenue || 0;
    const totalExpenses = (await getExpensesSum(year)).totalExpenses || 0;
    const availableBalance = await calculateAndInsertBalance(year);

    res.json({ availableBalance, totalRevenue, totalExpenses });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch budget data" });
  }
});

// Retrieve Inventory Data
app.get("/api/inventory", ensureAuthenticated, async (req, res) => {
  try {
    const inventory = await getInventory();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory data" });
  }
});

// Add Item to Inventory
app.post("/api/inventory", ensureAuthenticated, async (req, res) => {
  const { expense_id, location, usage_date, status } = req.body; // Updated to match sqlite.js
  try {
    await addInventoryItem(expense_id, location, usage_date, status);
    res.json({ success: true, message: "Item added to inventory" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add item to inventory" });
  }
});

// Retrieve Starting Balance
app.get("/api/starting-balance", ensureAuthenticated, async (req, res) => {
  try {
    const year = new Date().getFullYear(); // Get current year
    const balance = await getStartingBalance(year); // Pass year as parameter
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch starting balance" });
  }
});

// Fetch Months Endpoint
app.get("/api/months", ensureAuthenticated, async (req, res) => {
  const year = req.query.year;
  try {
    const result = await global.db.all(`
      SELECT DISTINCT strftime('%m', expense_date) AS month
      FROM expenses WHERE strftime('%Y', expense_date) = ?
      UNION
      SELECT DISTINCT strftime('%m', payment_date) AS month
      FROM revenue WHERE strftime('%Y', payment_date) = ?
    `, [year, year]);
    res.json(result.map(row => row.month));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Available Years Endpoint
app.get("/api/years", ensureAuthenticated, async (req, res) => {
  try {
    const result = await global.db.all(`
      SELECT DISTINCT strftime('%Y', expense_date) AS year FROM expenses
      UNION
      SELECT DISTINCT strftime('%Y', payment_date) AS year FROM revenue
    `);
    res.json(result.map(row => row.year));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Expense Input Endpoint
app.post("/api/expense-input", ensureAuthenticated, async (req, res) => {
  const { unit_id, category, item, price, expense_date, receipt_photo } = req.body;
  try {
    await global.db.run(
      "INSERT INTO expenses (unit_id, category, item, price, expense_date, last_updated, receipt_photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [unit_id, category, item, price, expense_date, new Date().toISOString(), receipt_photo]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Revenue Input Endpoint
app.post("/api/revenue-input", ensureAuthenticated, async (req, res) => {
  const { unit_id, amount, payment_date, method_id } = req.body;
  try {
    await global.db.run(
      "INSERT INTO revenue (unit_id, amount, payment_date, method_id) VALUES (?, ?, ?, ?)",
      [unit_id, amount, payment_date, method_id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

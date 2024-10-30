// Snippet 1: Import and Initialize Dependencies
// Make sure the initial imports and middleware setup are correctly done
const express = require("express");
const path = require("path");
const { initializeDatabase, getDb, getRevenue, getExpensesSum, getInventory, addInventoryItem, getStartingBalance, calculateAndInsertBalance } = require("./sqlite.js");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const app = express();

// Middleware setup
app.use(cookieParser());
app.use(session({
  secret: "a super secret key that should be stored securely",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Setup email transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});

const errorMessage = "Whoops! Error connecting to the database–please try again!";
initializeDatabase().then((db) => {
  global.db = getDb(); // Ensure db is globally accessible

  // Confirm db initialization
  console.log('DB Initialized:', global.db);

  // Root Route: Serve index.html
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  // Serve Static and Dynamic Routes Pages
  const pages = [
    "index.html", "budget-summary.html", "budget-details.html", "expense-report.html",
    "revenue-report.html", "expense-management.html", "revenue-management.html", "login.html",
    "forget-password.html", "header.html", "footer.html", "footer-settings.html",
    "style-modifier.html", "inventory-management.html"
  ];
  pages.forEach((page) => {
    app.get(`/${page}`, (req, res) => {
      res.sendFile(path.join(__dirname, "public", page));
    });
  });
});
// Snippet 3: Revenue Report Endpoint
app.get("/api/revenue-report", async (req, res) => {
  const { filter, year, month, unit } = req.query;
  let query = `SELECT r.unit_id, r.amount, r.payment_date, pm.method_name,
                 u.unit_number, u.floor, o.owner_name, t.tenant_name
                FROM revenue r
                JOIN payment_methods pm ON r.method_id = pm.method_id
                JOIN units u ON r.unit_id = u.unit_id
                JOIN owners o ON u.owner_id = o.owner_id
                LEFT JOIN tenants t ON u.tenant_id = t.tenant_id
                WHERE strftime('%Y', r.payment_date) = ?`;
  const queryParams = [year];
  if (filter === "month") {
    query += " AND strftime('%m', r.payment_date) = ?";
    queryParams.push(month);
  } else if (filter === "unit") {
    query += " AND r.unit_id = ?";
    queryParams.push(unit);
  }
  try {
    const result = await global.db.all(query, queryParams);
    res.json(result);
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 4: Expense Report Endpoint
app.get("/api/expense-report", async (req, res) => {
  const { filter, year, month, category } = req.query;
  let query = "SELECT unit_id, category, item, price, expense_date, last_updated FROM expenses WHERE strftime('%Y', expense_date) = ?";
  const queryParams = [year];
  if (filter === "month") {
    query += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  } else if (filter === "category") {
    query += " AND category = ?";
    queryParams.push(category);
  }
  try {
    const result = await global.db.all(query, queryParams);
    res.json(result);
  } catch (error) {
    console.error("Error fetching expense report:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 5: Budget Details Endpoint
app.get("/api/budget-details", async (req, res) => {
  const { filter, year, month } = req.query;
  let revenueQuery = "SELECT SUM(amount) AS totalRevenue FROM revenue WHERE strftime('%Y', payment_date) = ?";
  let expensesQuery = "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
  const queryParams = [year];
  if (filter === "month") {
    revenueQuery += " AND strftime('%m', payment_date) = ?";
    expensesQuery += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  }
  try {
    const revenueResult = await global.db.get(revenueQuery, queryParams);
    const expensesResult = await global.db.get(expensesQuery, queryParams);
    const availableBalance = (revenueResult.totalRevenue || 0) - (expensesResult.totalExpenses || 0);
    res.json({
      totalRevenue: revenueResult.totalRevenue || 0,
      totalExpenses: expensesResult.totalExpenses || 0,
      availableBalance,
    });
  } catch (error) {
    console.error("Error fetching budget details:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 6: Fetch Available Months Endpoint
app.get("/api/months", async (req, res) => {
  const year = req.query.year;
  try {
    const result = await global.db.all(`
      SELECT DISTINCT strftime('%m', expense_date) AS month 
      FROM expenses 
      WHERE strftime('%Y', expense_date) = ?
      UNION
      SELECT DISTINCT strftime('%m', payment_date) AS month 
      FROM revenue 
      WHERE strftime('%Y', payment_date) = ?
    `, [year, year]);
    res.json(result.map(row => row.month));
  } catch (error) {
    console.error("Error fetching months:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 7: Fetch Available Years Endpoint
app.get("/api/years", async (req, res) => {
  try {
    console.log('DB in /api/years:', global.db);
    const result = await global.db.all(`
      SELECT DISTINCT strftime('%Y', expense_date) AS year FROM expenses
      UNION
      SELECT DISTINCT strftime('%Y', payment_date) AS year FROM revenue
    `);
    res.json(result.map(row => row.year));
  } catch (error) {
    console.error("Error fetching years:", error);
    res.status(500).json({ error: error.message });
  }
});

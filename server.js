// Snippet 1: Imports and Middleware Setup
const express = require("express");
const path = require("path");
const fs = require("fs");
const { initializeDatabase, getRevenue, getExpensesSum, getBalance } = require("./sqlite.js");
const { sendWhatsAppMessage } = require("./twilioIntegration");
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
// Snippet 2: Database Initialization and Static File Routing
initializeDatabase().then((db) => {
  global.db = db; // Ensure db is globally accessible

  // Confirm db initialization
  console.log('DB Initialized:', global.db);

  // Root Route: Serve index.html
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  // Serve Static and Dynamic Routes Pages
  const pages = [
    "index.html", "budget-summary.html", "budget-details.html", "expense-report.html",
    "revenue-report.html", "expense-input.html", "revenue-input.html", "login.html",
    "forget-password.html", "header.html", "footer.html", "footer-settings.html",
    "style-modifier.html",
  ];

  pages.forEach((page) => {
    app.get(`/${page}`, (req, res) => {
      res.sendFile(path.join(__dirname, "public", page));
    });
  });

  // Proceed with next snippets for API endpoints...
// Snippet 3: Revenue Report Endpoint
// This snippet adds the revenue report endpoint to filter and fetch data based on the selected filter options.
app.get("/api/revenue-report", async (req, res) => {
  const { filter, year, month, unit } = req.query;
  let query = `SELECT p.unit_id, p.amount, p.payment_date, pm.method_name,
                u.unit_number, u.floor, o.owner_name, t.tenant_name, p.year, p.month
                FROM payments p
                JOIN payment_methods pm ON p.method_id = pm.method_id
                JOIN units u ON p.unit_id = u.unit_id
                JOIN owners o ON u.owner_id = o.owner_id
                JOIN tenants t ON u.tenant_id = t.tenant_id
                WHERE p.year = ?`;
  const queryParams = [year];

  if (filter === "month") {
    query += " AND p.month = ?";
    queryParams.push(month);
  } else if (filter === "unit") {
    query += " AND p.unit_id = ?";
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
// This snippet adds the expense report endpoint to filter and fetch data based on the selected filter options.
app.get("/api/expense-report", async (req, res) => {
  const { filter, year, month, category } = req.query;
  let query = "SELECT category, item, price, expense_date, last_updated FROM expenses WHERE strftime('%Y', expense_date) = ?";
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
// This snippet adds the budget details endpoint to fetch data based on the selected year and month.
app.get("/api/budget-details", async (req, res) => {
  const { filter, year, month } = req.query;
  const revenueQuery = "SELECT SUM(amount) AS totalRevenue FROM payments WHERE year = ?";
  const expensesQuery = "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
  const queryParams = [year];

  if (filter === "month") {
    revenueQuery += " AND month = ?";
    expensesQuery += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  }

  try {
    const revenueResult = await global.db.get(revenueQuery, queryParams);
    const expensesResult = await global.db.get(expensesQuery, queryParams);
    const balanceResult = await global.db.get(
      "SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = ?)",
      [year]
    );

    const availableBalance = balanceResult.starting_balance + revenueResult.totalRevenue - expensesResult.totalExpenses;

    res.json({
      totalRevenue: revenueResult.totalRevenue,
      totalExpenses: expensesResult.totalExpenses,
      availableBalance,
    });
  } catch (error) {
    console.error("Error fetching budget details:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 6: Fetch Available Months Endpoint
// This snippet adds the endpoint to fetch available months based on the selected year.
app.get("/api/months", async (req, res) => {
  try {
    const year = req.query.year;
    console.log('DB in /api/months:', global.db);
    const result = await global.db.all("SELECT DISTINCT strftime('%m', expense_date) AS month FROM expenses WHERE strftime('%Y', expense_date) = ?", [year]);
    res.json(result);
  } catch (error) {
    console.error("Error fetching months:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 7: Fetch Available Years Endpoint
// This snippet adds the endpoint to fetch available years from the database.
app.get("/api/years", async (req, res) => {
  try {
    console.log('DB in /api/years:', global.db);
    const result = await global.db.all("SELECT DISTINCT year FROM years");
    res.json(result);
  } catch (error) {
    console.error("Error fetching years:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 8: Expense Input Endpoint
// This snippet adds the expense input endpoint to allow dynamic data input for expenses.
app.post("/api/expense-input", async (req, res) => {
  const { category, newCategory, item, amount, paymentDate } = req.body;
  const finalCategory = newCategory || category;
  try {
    if (newCategory) {
      await global.db.run("INSERT INTO categories (name) VALUES (?)", [newCategory]);
    }
    await global.db.run(
      "INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)",
      [finalCategory, item, amount, paymentDate, new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Snippet 9: Revenue Input Endpoint
// This snippet adds the revenue input endpoint to allow dynamic data input for revenues.
app.post("/api/revenue-input", async (req, res) => {
  const { unitNumber, amount, paymentDate, paymentMethod } = req.body;
  try {
    await global.db.run(
      "INSERT INTO payments (unit_id, year, month, amount, payment_date, method_id) VALUES (?, strftime('%Y', ?), strftime('%m', ?), ?, ?, ?)",
      [unitNumber, paymentDate, paymentDate, amount, paymentDate, paymentMethod]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding revenue:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Snippet 1: Definitions and Middleware Setup
const express = require("express");
const path = require("path");
const fs = require("fs");
const { initializeDatabase, db, getRevenue, getExpensesSum, getBalance } = require("./sqlite.js");
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
// Snippet 2: Root Route
// This snippet defines the root route to serve the index.html file.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Snippet 3: Serve Static and Dynamic Routes Pages
// This snippet ensures that static files like CSS and JavaScript are served correctly.
const pages = [
  "index.html",
  "budget-summary.html",
  "budget-details.html",
  "expense-report.html",
  "revenue-report.html",
  "expense-input.html",
  "revenue-input.html",
  "login.html",
  "forget-password.html",
  "header.html",
  "footer.html",
  "footer-settings.html",
  "style-modifier.html",
];
pages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, "public", page));
  });
});
// Snippet 4: Revenue Report Endpoint
// This snippet adds the revenue report endpoint to filter and fetch data based on the selected filter options.
app.get("/api/revenue-report", async (req, res) => {
  const { filter, year, month, unit } = req.query;
  let query = "SELECT p.unit_id, p.amount, p.payment_date, pm.method_name, u.unit_number, u.floor, o.owner_name, t.tenant_name, p.year, p.month FROM payments p JOIN payment_methods pm ON p.method_id = pm.method_id JOIN units u ON p.unit_id = u.unit_id JOIN owners o ON u.owner_id = o.owner_id JOIN tenants t ON u.tenant_id = t.tenant_id WHERE p.year = ?";
  let queryParams = [year];

  if (filter === "month") {
    query += " AND p.month = ?";
    queryParams.push(month);
  } else if (filter === "unit") {
    query += " AND p.unit_id = ?";
    queryParams.push(unit);
  }

  try {
    const result = await db.all(query, queryParams);
    res.json(result);
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 5: Expense Report Endpoint
// This snippet adds the expense report endpoint to filter and fetch data based on the selected filter options.
app.get("/api/expense-report", async (req, res) => {
  const { filter, year, month, category } = req.query;
  let query = "SELECT category, item, price, expense_date, last_updated FROM expenses WHERE strftime('%Y', expense_date) = ?";
  let queryParams = [year];

  if (filter === "month") {
    query += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  } else if (filter === "category") {
    query += " AND category = ?";
    queryParams.push(category);
  }

  try {
    const result = await db.all(query, queryParams);
    res.json(result);
  } catch (error) {
    console.error("Error fetching expense report:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 6: Budget Details Endpoint
// This snippet adds the budget details endpoint to fetch data based on the selected year and month.
app.get("/api/budget-details", async (req, res) => {
  const { filter, year, month } = req.query;
  let revenueQuery = "SELECT SUM(amount) AS totalRevenue FROM payments WHERE year = ?";
  let expensesQuery = "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
  let queryParams = [year];

  if (filter === "month") {
    revenueQuery += " AND month = ?";
    expensesQuery += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  }

  try {
    const revenueResult = await db.get(revenueQuery, queryParams);
    const expensesResult = await db.get(expensesQuery, queryParams);
    const balanceResult = await db.get(
      "SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = ?)",
      [year]
    );

    const availableBalance = balanceResult.starting_balance + revenueResult.totalRevenue - expensesResult.totalExpenses;

    res.json({
      totalRevenue: revenueResult.totalRevenue,
      totalExpenses: expensesResult.totalExpenses,
      availableBalance: availableBalance,
    });
  } catch (error) {
    console.error("Error fetching budget details:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 7: Fetch Available Months Endpoint
app.get("/api/months", async (req, res) => {
  try {
    const year = req.query.year;
    const result = await db.all("SELECT DISTINCT strftime('%m', expense_date) AS month FROM expenses WHERE strftime('%Y', expense_date) = ?", [year]);
    res.json(result);
  } catch (error) {
    console.error("Error fetching months:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 8: Fetch Available Years Endpoint
app.get("/api/years", async (req, res) => {
  try {
    const result = await db.all("SELECT DISTINCT year FROM years");
    res.json(result);
  } catch (error) {
    console.error("Error fetching years:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 9: Expense Input Endpoint
// This snippet adds the expense input endpoint to allow dynamic data input for expenses.
app.post("/api/expense-input", async (req, res) => {
  const { category, newCategory, item, amount, paymentDate } = req.body;
  const finalCategory = newCategory || category;
  try {
    if (newCategory) {
      await db.run("INSERT INTO categories (name) VALUES (?)", [newCategory]);
    }
    await db.run(
      "INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)",
      [finalCategory, item, amount, paymentDate, new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Snippet 1: Import and Initialize Dependencies
// Make sure the initial imports and middleware setup are correctly done

const express = require("express");
const path = require("path");
const fs = require("fs");
const { initializeDatabase, getDb, getRevenue, getExpensesSum, getInventory, addInventoryItem, getStartingBalance } = require("./sqlite.js");
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
// Snippet 2: Revenue Report Endpoint
// This snippet adds the revenue report endpoint to filter and fetch data based on the selected filter options.
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
// Snippet 3: Expense Report Endpoint
// This snippet adds the expense report endpoint to filter and fetch data based on the selected filter options.
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
// Snippet 4: Budget Details Endpoint
// This snippet adds the budget details endpoint to fetch data based on the selected year and month.
app.get("/api/budget-details", async (req, res) => {
  const { filter, year, month } = req.query;
  const revenueQuery = "SELECT SUM(amount) AS totalRevenue FROM revenue WHERE strftime('%Y', payment_date) = ?";
  const expensesQuery = "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
  const queryParams = [year];
  if (filter === "month") {
    revenueQuery += " AND strftime('%m', payment_date) = ?";
    expensesQuery += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  }
  try {
    const revenueResult = await global.db.get(revenueQuery, queryParams);
    const expensesResult = await global.db.get(expensesQuery, queryParams);
    const availableBalance = revenueResult.totalRevenue - expensesResult.totalExpenses;
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
// Snippet 5: Fetch Available Months Endpoint
// This snippet adds the endpoint to fetch available months based on the selected year.
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
// Snippet 6: Fetch Available Years Endpoint
// This snippet adds the endpoint to fetch available years from the database.
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
// Snippet 7: Expense Input Endpoint
// This snippet adds the expense input endpoint to allow dynamic data input for expenses.
app.post("/api/expense-input", async (req, res) => {
  const { unit_id, category, item, price, expense_date, receipt_photo } = req.body;
  try {
    await global.db.run(
      "INSERT INTO expenses (unit_id, category, item, price, expense_date, last_updated, receipt_photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [unit_id, category, item, price, expense_date, new Date().toISOString(), receipt_photo]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Snippet 8: Revenue Input Endpoint
// This snippet adds the revenue input endpoint to allow dynamic data input for revenues.
app.post("/api/revenue-input", async (req, res) => {
  const { unit_id, amount, payment_date, method_id } = req.body;
  try {
    await global.db.run(
      "INSERT INTO revenue (unit_id, amount, payment_date, method_id) VALUES (?, ?, ?, ?)",
      [unit_id, amount, payment_date, method_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding revenue:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Snippet 9: Fetch Categories Endpoint
// This snippet adds an endpoint to fetch categories dynamically.
app.get("/api/categories", async (req, res) => {
  try {
    const result = await global.db.all("SELECT DISTINCT category FROM expenses");
    res.json(result.map(row => row.category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 10: Fetch Payment Methods Endpoint
// This snippet adds an endpoint to fetch payment methods dynamically.
app.get("/api/payment-methods", async (req, res) => {
  try {
    const result = await global.db.all("SELECT method_id, method_name FROM payment_methods");
    res.json(result);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 11: Login Endpoint
// This snippet handles login requests by verifying user credentials.
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await global.db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.authenticated = true;
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.json({ success: false });
  }
});
// Snippet 12: Password Reset Request Endpoint with Enhanced Logging
// This snippet handles requests to send a password reset email.
app.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await global.db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (user) {
      const resetToken = generateResetToken();
      await global.db.run("UPDATE users SET reset_token = ? WHERE email = ?", [
        resetToken,
        email,
      ]);
      sendResetEmail(email, resetToken); // Implement sendResetEmail function
      res.json({ success: true, message: "Reset email sent" });
    } else {
      res.json({ success: false, message: "Email not found" });
    }
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.json({ success: false });
  }
});

function generateResetToken() {
  return Math.random().toString(36).substr(2);
}

function sendResetEmail(email, token) {
  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Password Reset",
    text: `Please use the following token to reset your password: ${token}`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error("Error sending reset email:", error);
    }
    console.log("Reset email sent: " + info.response);
  });
}
// Snippet 13: Fetch Initial Data Endpoint with Enhanced Logging
// This snippet adds an endpoint to fetch initial data with enhanced logging.
app.get("/api/data", async (req, res) => {
  const year = req.query.year || new Date().getFullYear(); // Default to current year if not provided
  try {
    console.log('DB in /api/data:', global.db);
    console.log("Fetching starting balance...");
    const startingBalance = await getStartingBalance(year);
    console.log("Starting balance:", startingBalance);

    console.log("Fetching revenue...");
    const revenueResult = await getRevenue(year);
    console.log("Revenue result:", revenueResult);

    console.log("Fetching expenses...");
    const expensesResult = await getExpensesSum(year);
    console.log("Expenses result:", expensesResult);

    const availableBalance = startingBalance + revenueResult.totalRevenue - expensesResult.totalExpenses;
    res.json({
      totalRevenue: revenueResult.totalRevenue,
      totalExpenses: expensesResult.totalExpenses,
      availableBalance,
    });
  } catch (err) {
    console.error("Error fetching initial data:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Snippet 14: Check Authentication Status Endpoint
// This snippet adds an endpoint to check the user's authentication status.
app.get("/api/check-auth", (req, res) => {
  if (req.session.authenticated) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});
// Snippet 15: Server Wakeup Probe
// This snippet adds a wakeup probe endpoint to wake the server up.
app.get("/wakeup", (req, res) => {
  console.log("I'm awake");
  res.send("I'm awake");
});
// Snippet 16: Fetch Inventory Endpoint
// This snippet adds an endpoint to fetch inventory data.
app.get("/api/inventory", async (req, res) => {
  try {
    const result = await getInventory();
    res.json(result);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 16: Add Inventory Item Endpoint
// This snippet adds an endpoint to add a new inventory item.
app.post("/api/inventory", async (req, res) => {
  const { expense_id, location, usage_date, status } = req.body;
  try {
    await addInventoryItem(expense_id, location, usage_date, status);
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding inventory item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Snippet 17: Start the Server
// This snippet starts the server and listens on the specified port.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

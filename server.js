// Snippet 1: Definitions and Middleware Setup
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

//SNIPPET: Database Initialization

initializeDatabase().then((db) => {
  global.db = db; // Ensure db is globally accessible
  
  // Confirm db initialization
  console.log('DB Initialized:', global.db);
  

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
      const result = await global.db.all(query, queryParams);
      res.json(result);
    } catch (error) {
      console.error("Error fetching revenue report:", error);
      res.status(500).json({ error: error.message });
    }
  });
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
    const result = await global.db.all(query, queryParams);
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
    console.log('DB in /api/months:', global.db);
    const result = await global.db.all("SELECT DISTINCT strftime('%m', expense_date) AS month FROM expenses WHERE strftime('%Y', expense_date) = ?", [year]);
    res.json(result);
  } catch (error) {
    console.error("Error fetching months:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 8: Fetch Available Years Endpoint
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

// Snippet 9: Expense Input Endpoint
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
// Snippet 10: Revenue Input Endpoint
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
// Snippet 11: Fetch Categories and Payment Methods Endpoints
// This snippet adds endpoints to fetch categories and payment methods dynamically.
app.get("/api/categories", async (req, res) => {
  try {
    const result = await global.db.all("SELECT name FROM categories");
    res.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/payment-methods", async (req, res) => {
  try {
    const result = await global.db.all("SELECT method_id, method_name FROM payment_methods");
    res.json(result);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 12: Configure Server to Handle Clean URLs
// This snippet configures the server to handle clean URLs for login and forget password pages.
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/forget-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "forget-password.html"));
});
// Snippet 13: Login Endpoint
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
// Snippet 14: Password Reset Request Endpoint
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
// Snippet 15: Server Wakeup Probe and Start the Server
// This snippet adds a wakeup probe endpoint and starts the server.
app.get("/wakeup", (req, res) => {
  console.log("I'm awake");
  res.send("I'm awake");
});

// Snippet 16: Check Authentication Status Endpoint
// This snippet adds an endpoint to check the user's authentication status.
app.get("/api/check-auth", (req, res) => {
  if (req.session.authenticated) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// Snippet 17: Fetch Initial Data Endpoint with Enhanced Logging
// Initialize database
initializeDatabase().then((database) => {
  global.db = database;

  app.get("/api/data", async (req, res) => {
    try {
      console.log('DB in /api/data:', global.db);
      console.log("Fetching revenue...");
      const revenueResult = await getRevenue();
      console.log("Revenue result:", revenueResult);

      console.log("Fetching expenses...");
      const expensesResult = await getExpensesSum();
      console.log("Expenses result:", expensesResult);

      console.log("Fetching balance...");
      const balanceResult = await getBalance();
      console.log("Balance result:", balanceResult);

      if (!balanceResult || !revenueResult || !expensesResult) {
        throw new Error("Failed to fetch one or more components of initial data.");
      }

      const availableBalance = balanceResult.starting_balance + revenueResult.totalRevenue - expensesResult.totalExpenses;

      res.json({
        totalRevenue: revenueResult.totalRevenue,
        totalExpenses: expensesResult.totalExpenses,
        availableBalance: availableBalance,
      });
    } catch (error) {
      console.error("Error fetching initial data:", error);
      res.status(500).json({ error: error.message });
    }
  });

});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}`);
});

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
} = require("./sqlite.js");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const app = express();

// 2. Middleware Setup
app.use(cookieParser());
app.use(
  session({
    secret: "a super secret key that should be stored securely",
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
  console.log("Checking authentication:", req.session.userId);
  if (req.session.userId) {
    return next();
  } else {
    console.log("User not authenticated, redirecting to login");
    res.redirect("/login.html");
  }
}

// Protected Routes
app.get("/dashboard.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
app.get("/profile.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});
app.get("/expense-management.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "expense-management.html"));
});
app.get("/revenue-management.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "revenue-management.html"));
});
app.get("/inventory-management.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "inventory-management.html"));
});

// 4. Setup Email Transport
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const errorMessage =
  "Whoops! Error connecting to the database–please try again!";

// 5. Database Initialization and Root Route
initializeDatabase().then((db) => {
  global.db = getDb(); // Ensure db is globally accessible

  // Confirm db initialization
  console.log("DB Initialized:", global.db);

  // Root Route: Serve index.html
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  // Serve Static and Dynamic Routes Pages
  const pages = [
    "index.html",
    "budget-summary.html",
    "budget-details.html",
    "expense-report.html",
    "revenue-report.html",
    "expense-management.html",
    "revenue-management.html",
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
app.get("/api/data", ensureAuthenticated, async (req, res) => {
  try {
    console.log("Fetching budget data");
    const year = new Date().getFullYear();

    console.log("Getting total revenue");
    const totalRevenue = (await getRevenue(year)).totalRevenue || 0;

    console.log("Getting total expenses");
    const totalExpenses = (await getExpensesSum(year)).totalExpenses || 0;

    console.log("Calculating available balance");
    const availableBalance = await calculateAndInsertBalance(year);

    const budgetData = {
      availableBalance,
      totalRevenue,
      totalExpenses,
    };
    console.log("Budget Data:", budgetData);
    res.json(budgetData);
  } catch (error) {
    console.error("Error fetching budget data:", error);
    res.status(500).json({ error: "Failed to fetch budget data" });
  }
});

// Fetch Months Endpoint
app.get("/api/months", async (req, res) => {
  const year = req.query.year;
  try {
    console.log("Fetching months for year:", year);
    const result = await global.db.all(
      `
      SELECT DISTINCT strftime('%m', expense_date) AS month
      FROM expenses
      WHERE strftime('%Y', expense_date) = ?
      UNION
      SELECT DISTINCT strftime('%m', payment_date) AS month
      FROM revenue
      WHERE strftime('%Y', payment_date) = ?
      `,
      [year, year]
    );
    console.log("Months fetched:", result);
    res.json(result.map((row) => row.month));
  } catch (error) {
    console.error("Error fetching months:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch Available Years Endpoint
app.get("/api/years", async (req, res) => {
  try {
    console.log("Fetching available years");
    const result = await global.db.all(`
      SELECT DISTINCT strftime('%Y', expense_date) AS year FROM expenses
      UNION
      SELECT DISTINCT strftime('%Y', payment_date) AS year FROM revenue
      `);
    console.log("Years fetched:", result);
    res.json(result.map((row) => row.year));
  } catch (error) {
    console.error("Error fetching years:", error);
    res.status(500).json({ error: error.message });
  }
});

// Expense Input Endpoint
app.post("/api/expense-input", async (req, res) => {
  const { unit_id, category, item, price, expense_date, receipt_photo } =
    req.body;
  try {
    console.log("Adding expense:", req.body);
    await global.db.run(
      "INSERT INTO expenses (unit_id, category, item, price, expense_date, last_updated, receipt_photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        unit_id,
        category,
        item,
        price,
        expense_date,
        new Date().toISOString(),
        receipt_photo,
      ]
    );
    console.log("Expense added successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Revenue Input Endpoint
app.post("/api/revenue-input", async (req, res) => {
  const { unit_id, amount, payment_date, method_id } = req.body;
  try {
    console.log("Adding revenue:", req.body);
    await global.db.run(
      "INSERT INTO revenue (unit_id, amount, payment_date, method_id) VALUES (?, ?, ?, ?)",
      [unit_id, amount, payment_date, method_id]
    );
    console.log("Revenue added successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding revenue:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch Categories Endpoint
app.get("/api/categories", async (req, res) => {
  try {
    console.log("Fetching categories");
    const result = await global.db.all(
      "SELECT DISTINCT category FROM expenses"
    );
    console.log("Categories fetched:", result);
    res.json(result.map((row) => row.category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch Payment Methods Endpoint
app.get("/api/payment-methods", async (req, res) => {
  try {
    console.log("Fetching payment methods");
    const result = await global.db.all(
      "SELECT method_id, method_name FROM payment_methods"
    );
    console.log("Payment methods fetched:", result);
    res.json(result);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ error: error.message });
  }
});

// User Authentication Check Endpoint
app.get("/api/check-auth", async (req, res) => {
  console.log("Checking authentication status");
  if (req.session.userId) {
    const user = await global.db.get(
      "SELECT first_name FROM users WHERE id = ?",
      [req.session.userId]
    );
    console.log("User authenticated:", user);
    return res.json({ isAuthenticated: true, user });
  }
  console.log("User not authenticated");
  res.json({ isAuthenticated: false });
});

// User Registration Endpoint
app.post("/register", async (req, res) => {
  const { username, password, first_name, last_name, birthdate, email } =
    req.body;
  try {
    console.log("Received registration request with data:", req.body);

    // Check if username already exists
    const existingUser = await global.db.get(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    await global.db.run(
      "INSERT INTO users (username, password, first_name, last_name, birthdate, email) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hashedPassword, first_name, last_name, birthdate, email]
    );

    console.log("User registered successfully");
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
});

// User Login Endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log("Received login request:", req.body);
    const user = await global.db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user.id;
      console.log("User logged in:", user);
      res.json({ success: true, user });
    } else {
      console.log("Login failed: Invalid username or password");
      res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

// Logout Endpoint
app.get("/logout", (req, res) => {
  console.log("User logged out");
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to logout" });
    }
    res.redirect("/login.html");
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

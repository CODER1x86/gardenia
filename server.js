// Snippet 1: Import and Initialize Dependencies
// Make sure the initial imports and middleware setup are correctly done
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

// Middleware setup
app.use(cookieParser());
app.use(
  session({
    secret: "a super secret key that should be stored securely",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Setup email transport
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
const errorMessage =
  "Whoops! Error connecting to the database–please try again!";
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
app.get("/api/data", async (req, res) => {
  try {
    console.log("Starting /api/data request...");
    const year = new Date().getFullYear();

    console.log("Fetching starting balance...");
    const startingBalance = await getStartingBalance(year);
    console.log("Starting balance:", startingBalance);

    console.log("Fetching revenue...");
    const revenueResult = await getRevenue(year);
    console.log("Revenue result:", revenueResult);

    console.log("Fetching expenses...");
    const expensesResult = await getExpensesSum(year);
    console.log("Expenses result:", expensesResult);

    const availableBalance =
      startingBalance +
      revenueResult.totalRevenue -
      expensesResult.totalExpenses;
    res.json({
      totalRevenue: revenueResult.totalRevenue,
      totalExpenses: expensesResult.totalExpenses,
      availableBalance,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
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
  let query =
    "SELECT unit_id, category, item, price, expense_date, last_updated FROM expenses WHERE strftime('%Y', expense_date) = ?";
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
  let revenueQuery =
    "SELECT SUM(amount) AS totalRevenue FROM revenue WHERE strftime('%Y', payment_date) = ?";
  let expensesQuery =
    "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
  const queryParams = [year];
  if (filter === "month") {
    revenueQuery += " AND strftime('%m', payment_date) = ?";
    expensesQuery += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  }
  try {
    const revenueResult = await global.db.get(revenueQuery, queryParams);
    const expensesResult = await global.db.get(expensesQuery, queryParams);
    const availableBalance =
      (revenueResult.totalRevenue || 0) - (expensesResult.totalExpenses || 0);
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
    res.json(result.map((row) => row.month));
  } catch (error) {
    console.error("Error fetching months:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 7: Fetch Available Years Endpoint
app.get("/api/years", async (req, res) => {
  try {
    console.log("DB in /api/years:", global.db);
    const result = await global.db.all(`
      SELECT DISTINCT strftime('%Y', expense_date) AS year FROM expenses
      UNION
      SELECT DISTINCT strftime('%Y', payment_date) AS year FROM revenue
    `);
    res.json(result.map((row) => row.year));
  } catch (error) {
    console.error("Error fetching years:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 8: Expense Input Endpoint
app.post("/api/expense-input", async (req, res) => {
  const { unit_id, category, item, price, expense_date, receipt_photo } =
    req.body;
  try {
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
    res.json({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Snippet 9: Revenue Input Endpoint
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
// Snippet 10: Fetch Categories Endpoint
app.get("/api/categories", async (req, res) => {
  try {
    const result = await global.db.all(
      "SELECT DISTINCT category FROM expenses"
    );
    res.json(result.map((row) => row.category));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 11: Fetch Payment Methods Endpoint
app.get("/api/payment-methods", async (req, res) => {
  try {
    const result = await global.db.all(
      "SELECT method_id, method_name FROM payment_methods"
    );
    res.json(result);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/check-auth", (req, res) => {
  if (req.session.userId) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// User Registration Endpoint
app.post("/register", async (req, res) => {
  const { username, password, first_name, last_name, birthdate, email } = req.body;
  try {
    console.log("Received registration request with data:", req.body); // Log incoming data

    // Check if the username or email already exists
    const userExists = await global.db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
    if (userExists) {
      console.log("Username or email already taken:", userExists);
      return res.status(409).json({ error: "Username or email already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log("Verification token generated:", verificationToken);

    // Store user in database
    await global.db.run("INSERT INTO users (username, password, first_name, last_name, birthdate, email, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)", [username, hashedPassword, first_name, last_name, birthdate, email, verificationToken]);
    console.log("User saved to database");

    // Send verification email
    const verificationLink = `https://your-site.com/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification',
      text: `Please verify your email by clicking the following link: ${verificationLink}`
    });
    console.log("Verification email sent to:", email);

    res.json({ success: true });
  } catch (error) {
    console.error("Error registering user:", error); // Detailed logging
    res.status(500).json({ error: error.message });
  }
});

// Snippet 12: Login Endpoint
// User Login Endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Fetch user from database
    const user = await global.db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    req.session.userId = user.id; // Assign session variable

    res.json({ success: true });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: error.message });
  }
});
// Snippet 13: Password Reset Endpoint
app.post("/forget-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await global.db.get("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (user) {
      // Generate a temporary reset token and set an expiration time
      const resetToken = Math.random().toString(36).substring(2, 15);
      const resetExpires = Date.now() + 3600000; // 1 hour
      await global.db.run(
        "UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?",
        [resetToken, resetExpires, email]
      );
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        text: `Click the link to reset your password: http://localhost:3000/reset-password/${resetToken}`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res.status(500).send("Error sending email");
        }
        res.send("Password reset email sent");
      });
    } else {
      res.status(404).send("Email not found");
    }
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).send("Server error");
  }
});
// Snippet 14: Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

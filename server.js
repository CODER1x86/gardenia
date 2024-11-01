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
      maxAge: 4 * 60 * 60 * 1000, // Session duration of 4 hours},
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
    const availableBalance = 1000; // Placeholder value, replace with actual calculation
    const totalRevenue = 5000; // Placeholder value, replace with actual calculation
    const totalExpenses = 4000; // Placeholder value, replace with actual calculation

    const budgetData = {
      availableBalance,
      totalRevenue,
      totalExpenses,
    };
    res.json(budgetData);
  } catch (error) {
    console.error("Error fetching budget data:", error);
    res.status(500).json({ error: "Failed to fetch budget data" });
  }
});

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

// Snippet 12: User Authentication Endpoint
app.get("/api/check-auth", async (req, res) => {
  if (req.session.userId) {
    const user = await global.db.get(
      "SELECT first_name FROM users WHERE id = ?",
      [req.session.userId]
    );
    return res.json({ isAuthenticated: true, user });
  }
  res.json({ isAuthenticated: false });
});

// Snippet 13: User Registration Endpoint
app.post("/register", async (req, res) => {
  const { username, password, first_name, last_name, birthdate, email } =
    req.body;
  try {
    console.log("Received registration request with data:", req.body); // Log incoming data

    // Check if the username or email already exists
    const userExists = await global.db.get(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (userExists) {
      console.log("Username or email already taken:", userExists);
      return res.status(409).json({ error: "Username or email already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    console.log("Verification token generated:", verificationToken);

    // Store user in database
    await global.db.run(
      "INSERT INTO users (username, password, first_name, last_name, birthdate, email, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        username,
        hashedPassword,
        first_name,
        last_name,
        birthdate,
        email,
        verificationToken,
      ]
    );
    console.log("User saved to database");

    // Send verification email
    const verificationLink = `https://your-site.com/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      text: `Please verify your email by clicking the following link: ${verificationLink}`,
    });
    console.log("Verification email sent to:", email);

    res.json({ success: true });
  } catch (error) {
    console.error("Error registering user:", error); // Detailed logging
    res.status(500).json({ error: error.message });
  }
});

// Snippet 14: User Login Endpoint
app.post("/login", async (req, res) => {
  const { username, password, rememberMe } = req.body;
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

    req.session.userId = user.id;

    // Set session cookie maxAge if "Remember Me" is checked
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: error.message });
  }
});

// Snippet 15: Password Reset Endpoint
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

// Snippet 16: Fetch User Profile
app.get("/api/profile", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await global.db.get(
    "SELECT first_name, last_name, birthdate, email FROM users WHERE id = ?",
    [req.session.userId]
  );
  res.json(user);
});

// Snippet 17: Update User Profile
app.post("/api/profile", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { first_name, last_name, birthdate, email } = req.body;
  const userId = req.session.userId;

  // Update user data
  await global.db.run(
    "UPDATE users SET first_name = ?, last_name = ?, birthdate = ?, email = ? WHERE id = ?",
    [first_name, last_name, birthdate, email, userId]
  );

  // Generate a new verification token if the email is updated
  const verificationToken = crypto.randomBytes(32).toString("hex");
  await global.db.run("UPDATE users SET verification_token = ? WHERE id = ?", [
    verificationToken,
    userId,
  ]);

  // Send verification email
  const verificationLink = `https://your-site.com/verify-email?token=${verificationToken}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification",
    text: `Please verify your email by clicking the following link: ${verificationLink}`,
  });

  res.json({ success: true });
});

// Snippet 18: Verify Email
app.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  const user = await global.db.get(
    "SELECT id FROM users WHERE verification_token = ?",
    [token]
  );
  if (user) {
    await global.db.run(
      "UPDATE users SET verification_token = NULL WHERE id = ?",
      [user.id]
    );
    res.send("Email verified successfully.");
  } else {
    res.status(400).send("Invalid verification token.");
  }
});

// Snippet 19: Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Imports and Definitions
const express = require("express");
const path = require("path");
const fs = require("fs");
const { initializeDatabase, getDb, getRevenue, getExpensesSum, getBalance } = require("./sqlite.js");
const { sendWhatsAppMessage } = require("./twilioIntegration");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");

const app = express();
const errorMessage = "Whoops! Error connecting to the database–please try again!";

// Middleware setup
app.use(cookieParser());
app.use(session({
  secret: "a super secret key that should be stored securely",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Email transport setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});

// Route to serve static files (public pages)
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

// Initialize Database and Define Routes
initializeDatabase().then(() => {
  global.db = getDb();
  console.log('DB Initialized:', global.db);

  // Endpoint: Root Route
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  // Endpoint: Revenue Report
  app.get("/api/revenue-report", (req, res) => {
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

    global.db.all(query, queryParams, (err, rows) => {
      if (err) {
        console.error("Error fetching revenue report:", err);
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
  });

  // Endpoint: Expense Report
  app.get("/api/expense-report", (req, res) => {
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

    global.db.all(query, queryParams, (err, rows) => {
      if (err) {
        console.error("Error fetching expense report:", err);
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
  });

  // Endpoint: Budget Details
  app.get("/api/budget-details", (req, res) => {
    const { filter, year, month } = req.query;
    const revenueQuery = "SELECT SUM(amount) AS totalRevenue FROM payments WHERE year = ?";
    const expensesQuery = "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
    const queryParams = [year];

    if (filter === "month") {
      revenueQuery += " AND month = ?";
      expensesQuery += " AND strftime('%m', expense_date) = ?";
      queryParams.push(month);
    }

    global.db.get(revenueQuery, queryParams, (err, revenueResult) => {
      if (err) {
        console.error("Error fetching revenue:", err);
        res.status(500).json({ error: err.message });
        return;
      }

      global.db.get(expensesQuery, queryParams, (err, expensesResult) => {
        if (err) {
          console.error("Error fetching expenses:", err);
          res.status(500).json({ error: err.message });
          return;
        }

        global.db.get("SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = ?)", [year], (err, balanceResult) => {
          if (err) {
            console.error("Error fetching balance:", err);
            res.status(500).json({ error: err.message });
            return;
          }

          const availableBalance = balanceResult.starting_balance + revenueResult.totalRevenue - expensesResult.totalExpenses;
          res.json({
            totalRevenue: revenueResult.totalRevenue,
            totalExpenses: expensesResult.totalExpenses,
            availableBalance,
          });
        });
      });
    });
  });

  // Endpoint: Input New Expense
  app.post("/api/expense-input", (req, res) => {
    const { category, newCategory, item, amount, paymentDate } = req.body;
    const finalCategory = newCategory || category;

    if (newCategory) {
      global.db.run("INSERT INTO categories (name) VALUES (?)", [newCategory], (err) => {
        if (err) {
          console.error("Error adding new category:", err);
          res.status(500).json({ success: false, error: err.message });
          return;
        }
        insertExpense(finalCategory, item, amount, paymentDate, res);
      });
    } else {
      insertExpense(finalCategory, item, amount, paymentDate, res);
    }
  });

  function insertExpense(category, item, amount, paymentDate, res) {
    global.db.run(
      "INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)",
      [category, item, amount, paymentDate, new Date().toISOString()],
      (err) => {
        if (err) {
          console.error("Error adding expense:", err);
          res.status(500).json({ success: false, error: err.message });
        } else {
          res.json({ success: true });
        }
      }
    );
  }

  // Endpoint: Input New Revenue
  app.post("/api/revenue-input", (req, res) => {
    const { unitNumber, amount, paymentDate, paymentMethod } = req.body;
    global.db.run(
      "INSERT INTO payments (unit_id, year, month, amount, payment_date, method_id) VALUES (?, strftime('%Y', ?), strftime('%m', ?), ?, ?, ?)",
      [unitNumber, paymentDate, paymentDate, amount, paymentDate, paymentMethod],
      (err) => {
        if (err) {
          console.error("Error adding revenue:", err);
          res.status(500).json({ success: false, error: err.message });
        } else {
          res.json({ success: true });
        }
      }
    );
  });

  // Endpoint: Fetch Categories
  app.get("/api/categories", (req, res) => {
    global.db.all("SELECT name FROM categories", (err, rows) => {
      if (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
  });

  // Endpoint: Fetch Payment Methods
  app.get("/api/payment-methods", (req, res) => {
    global.db.all("SELECT method_id, method_name FROM payment_methods", (err, rows) => {
      if (err) {
        console.error("Error fetching payment methods:", err);
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
  });

  // Endpoint: Fetch Initial Data
  app.get("/api/data", async (req, res) => {
    try {
      const revenueResult = await getRevenue();
      const expensesResult = await getExpensesSum();
      const balanceResult = await getBalance();

      if (!balanceResult || !revenueResult || !expensesResult) {
        throw new Error("Failed to fetch one or more components of initial data.");
      }

      const availableBalance = balanceResult.starting_balance + revenueResult.totalRevenue - expensesResult.totalExpenses;
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
  
  // Start Server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Database initialization error:", error);
});

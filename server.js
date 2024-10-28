// Snippet 1: Imports and Definitions
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
// Snippet 2: Middleware Setup
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
// Snippet 3: Email Transport Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});
// Snippet 4: Database Initialization and Static Files Routing
initializeDatabase().then(() => {
  global.db = getDb();
  console.log('DB Initialized:', global.db);

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

  // Endpoint: Root Route
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
  
  // Define other routes and endpoints below...
// Snippet 5: Revenue Report Endpoint
// This snippet adds the revenue report endpoint to filter and fetch data based on the selected filter options.
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
// Snippet 6: Expense Report Endpoint
// This snippet adds the expense report endpoint to filter and fetch data based on the selected filter options.
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
// Snippet 7: Budget Details Endpoint
// This snippet adds the budget details endpoint to fetch data based on the selected year and month.
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
// Snippet 8: Input New Expense
// This snippet adds the expense input endpoint to allow dynamic data input for expenses.
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
// Snippet 9: Input New Revenue
// This snippet adds the revenue input endpoint to allow dynamic data input for revenues.
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
// Snippet 10: Fetch Categories
// This snippet adds an endpoint to fetch categories dynamically.
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
// Snippet 11: Fetch Payment Methods
// This snippet adds an endpoint to fetch payment methods dynamically.
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
// Snippet 12: Fetch Initial Data
// This snippet adds an endpoint to fetch initial data with enhanced logging.
app.get("/api/data", async (req, res) => {
  try {
    const revenueResult = await getRevenue();
    console.log("Revenue Result:", revenueResult);
    const expensesResult = await getExpensesSum();
    console.log("Expenses Result:", expensesResult);
    const balanceResult = await getBalance();
    console.log("Balance Result:", balanceResult);

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
// Snippet 13: Server Wakeup Probe
// This snippet adds a wakeup probe endpoint to wake the server up.
app.get("/wakeup", (req, res) => {
  console.log("I'm awake");
  res.send("I'm awake");
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
// Snippet 15: Start Server
// This snippet starts the server and listens on the specified port.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

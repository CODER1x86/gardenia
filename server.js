const winston = require("winston");
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./authRoutes");
const paymentRoutes = require("./paymentRoutes");
const unitRoutes = require("./unitRoutes");
const db = require("./sqlite"); // Ensure this import is correct based on your structure

// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(helmet()); // Adding Helmet to enhance security

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Change to true if using HTTPS
  })
);
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Change to true if using HTTPS
  })
);

// Use route modules
app.use("/api", authRoutes);
app.use("/api", paymentRoutes);
app.use("/api", unitRoutes);

// Edit Expense Route
app.post("/expenses/edit/:expense_id", async (req, res) => {
  const { expense_id } = req.params;
  const { category, item, price, expense_date } = req.body;
  try {
    await db.updateExpense(expense_id, category, item, price, expense_date);
    res.json({ message: "Expense updated successfully." });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense." });
  }
});

// Delete Expense Route
app.post("/expenses/delete/:expense_id", async (req, res) => {
  const { expense_id } = req.params;
  try {
    await db.deleteExpense(expense_id);
    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense." });
  }
});
// Use winston for logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send("Something broke!");
});

// Content Security Policy (CSP) setup
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://apis.google.com"],
    styleSrc: ["'self'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
  }
}));

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log("Ensure HTTPS is enforced for production use.");
  }
});

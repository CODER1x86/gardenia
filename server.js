const winston = require("winston");
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
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const authRoutes = require("./authRoutes");
const paymentRoutes = require("./paymentRoutes");
const unitRoutes = require("./unitRoutes");
const db = require("./sqlite"); // Ensure this import is correct based on your structure

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
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

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

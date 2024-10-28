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

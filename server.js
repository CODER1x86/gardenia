// Snippet 1: Definitions and Middleware Setup
// This snippet includes necessary definitions and sets up middleware for Fastify, session handling, cookies, and form parsing.
const fastify = require("fastify")({ logger: false });
const path = require("path");
const fs = require("fs");
const db = require("./sqlite.js");
const { sendWhatsAppMessage } = require("./twilioIntegration");
const session = require("@fastify/session");
const cookie = require("@fastify/cookie");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Middleware setup
fastify.register(cookie);
fastify.register(session, {
  secret: "a super secret key that should be stored securely",
  cookie: { secure: false },
  saveUninitialized: false,
  resave: false,
});
fastify.register(require("@fastify/formbody"));

// Setup email transport
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});

const errorMessage = "Whoops! Error connecting to the database–please try again!";
// Snippet 2: Root Route
// This snippet defines the root route to serve the index.html file.
fastify.get("/", (request, reply) => {
  const filePath = path.join(__dirname, "public", "index.html");
  fs.readFile(filePath, (err, data) => {
    if (err) {
      reply.status(500).send("Internal Server Error");
    } else {
      reply.type("text/html").send(data);
    }
  });
});
// Snippet 3: Serve Static and Dynamic Routes Pages
// This snippet ensures that static files like CSS and JavaScript are served correctly.
const fastifyStatic = require('fastify-static');
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/public/', // optional: default '/'
});

// This snippet defines routes to serve static pages from the public folder.
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
  fastify.get(`/${page}`, (request, reply) => {
    const filePath = path.join(__dirname, "public", page);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reply.status(500).send("Internal Server Error");
      } else {
        reply.type("text/html").send(data);
      }
    });
  });
});
// Snippet 4: Revenue Report Endpoint
// This snippet adds the revenue report endpoint to filter and fetch data based on the selected filter options.
fastify.get("/api/revenue-report", async (request, reply) => {
  const { filter, year, month, unit, floor } = request.query;
  let query = "SELECT * FROM payments WHERE year = ?";
  let queryParams = [year];

  if (filter === "month") {
    query += " AND month = ?";
    queryParams.push(month);
  } else if (filter === "unit") {
    query += " AND unit_id = ?";
    queryParams.push(unit);
  } else if (filter === "floor") {
    query = `
      SELECT p.*, u.unit_number, u.floor, o.owner_name, t.tenant_name 
      FROM payments p 
      JOIN units u ON p.unit_id = u.unit_id 
      JOIN owners o ON u.owner_id = o.owner_id 
      JOIN tenants t ON u.tenant_id = t.tenant_id 
      WHERE u.floor = ? AND p.year = ?
    `;
    queryParams = [floor, year];
  }

  try {
    const result = await db.all(query, queryParams);
    reply.send(result);
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    reply.status(500).send({ error: errorMessage });
  }
});
// Snippet 5: Expense Report Endpoint
// This snippet adds the expense report endpoint to filter and fetch data based on the selected filter options.
fastify.get("/api/expense-report", async (request, reply) => {
  const { filter, year, month, category } = request.query;
  let query = "SELECT * FROM expenses WHERE strftime('%Y', expense_date) = ?";
  let queryParams = [year];

  if (filter === "month") {
    query += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  } else if (filter === "category") {
    query += " AND category = ?";
    queryParams.push(category);
  }

  try {
    const result = await db.all(query, queryParams);
    reply.send(result);
  } catch (error) {
    console.error("Error fetching expense report:", error);
    reply.status(500).send({ error: errorMessage });
  }
});
// Snippet 6: Budget Details Endpoint
// This snippet adds the budget details endpoint to fetch data based on the selected year and month.
fastify.get("/api/budget-details", async (request, reply) => {
  const { year, month } = request.query;
  let revenueQuery = "SELECT SUM(amount) AS totalRevenue FROM payments WHERE year = ?";
  let expensesQuery = "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
  let queryParams = [year];

  if (month) {
    revenueQuery += " AND month = ?";
    expensesQuery += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  }

  try {
    const revenueResult = await db.get(revenueQuery, queryParams);
    const expensesResult = await db.get(expensesQuery, queryParams);
    const balanceResult = await db.get("SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = ?)", [year]);

    const availableBalance = balanceResult.starting_balance + revenueResult.totalRevenue - expensesResult.totalExpenses;

    reply.send({
      totalRevenue: revenueResult.totalRevenue,
      totalExpenses: expensesResult.totalExpenses,
      availableBalance: availableBalance,
    });
  } catch (error) {
    console.error("Error fetching budget details:", error);
    reply.status(500).send({ error: errorMessage });
  }
});

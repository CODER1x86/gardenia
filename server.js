//Snippet 1: Defnitions

const fastify = require("fastify")({ logger: false });
const path = require("path");
const fs = require("fs");
const db = require("./sqlite.js");
const { sendWhatsAppMessage } = require("./twilioIntegration");
const session = require("@fastify/session");
const cookie = require("@fastify/cookie");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
// Setup email transport
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});
const errorMessage =
  "Whoops! Error connecting to the database–please try again!";

// Snippet 2: Ensure 'db' has the necessary methods to interact with the SQLite database

module.exports = {
  getExpenses: async () => {
    try {
      return await db.all("SELECT * FROM expenses");
    } catch (dbError) {
      console.error("Error fetching expenses:", dbError);
    }
  },
  addExpense: async (expense) => {
    let success = false;
    try {
      success = await db.run(
        "INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)",
        [
          expense.category,
          expense.item,
          expense.price,
          expense.expense_date,
          expense.last_updated,
        ]
      );
    } catch (dbError) {
      console.error("Error adding expense:", dbError);
    }
    return success.changes > 0 ? true : false;
  },
  getRevenue: async () => {
    try {
      return await db.get(
        "SELECT SUM(total_paid) AS totalRevenue FROM revenue"
      );
    } catch (dbError) {
      console.error("Error fetching revenue:", dbError);
    }
  },
  getExpensesSum: async () => {
    try {
      return await db.get("SELECT SUM(price) AS totalExpenses FROM expenses");
    } catch (dbError) {
      console.error("Error fetching total expenses:", dbError);
    }
  },
  getBalance: async () => {
    try {
      return await db.get(
        "SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = strftime('%Y', 'now'))"
      );
    } catch (dbError) {
      console.error("Error fetching balance:", dbError);
    }
  },
  // Add more methods for other operations as needed
};

//Snippet 3: Add the revenue report endpoint to filter and fetch data based on the selected filter options.

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

//Snippet 4: Add the expense report endpoint to filter and fetch data based on the selected filter options.

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

// Snippet 5: Add the budget details endpoint to fetch data based on the selected year and month.

fastify.get("/api/budget-details", async (request, reply) => {
  const { year, month } = request.query;
  let revenueQuery =
    "SELECT SUM(amount) AS totalRevenue FROM payments WHERE year = ?";
  let expensesQuery =
    "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?";
  let queryParams = [year];

  if (month) {
    revenueQuery += " AND month = ?";
    expensesQuery += " AND strftime('%m', expense_date) = ?";
    queryParams.push(month);
  }

  try {
    const revenueResult = await db.get(revenueQuery, queryParams);
    const expensesResult = await db.get(expensesQuery, queryParams);

    const balanceResult = await db.get(
      "SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = ?)",
      [year]
    );

    const availableBalance =
      balanceResult.starting_balance +
      revenueResult.totalRevenue -
      expensesResult.totalExpenses;

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

//Snippet 6: Add the expense input endpoint to allow dynamic data input for expenses.

fastify.post("/api/expense-input", async (request, reply) => {
  const { category, newCategory, item, amount, paymentDate } = request.body;
  const finalCategory = newCategory || category;

  try {
    if (newCategory) {
      await db.run("INSERT INTO categories (name) VALUES (?)", [newCategory]);
    }
    await db.run(
      "INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)",
      [finalCategory, item, amount, paymentDate, new Date().toISOString()]
    );

    reply.send({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    reply.status(500).send({ success: false, error: errorMessage });
  }
});

//Snippet 7: Add the revenue input endpoint to allow dynamic data input for revenues.

fastify.post("/api/revenue-input", async (request, reply) => {
  const { unitNumber, amount, paymentDate, paymentMethod } = request.body;

  try {
    await db.run(
      "INSERT INTO payments (unit_id, year, month, amount, payment_date, method_id) VALUES (?, strftime('%Y', ?), strftime('%m', ?), ?, ?, ?)",
      [unitNumber, paymentDate, paymentDate, amount, paymentDate, paymentMethod]
    );

    reply.send({ success: true });
  } catch (error) {
    console.error("Error adding revenue:", error);
    reply.status(500).send({ success: false, error: errorMessage });
  }
});

//Snippet 8: Add endpoints to fetch categories and payment methods dynamically.

fastify.get("/api/categories", async (request, reply) => {
  try {
    const result = await db.all("SELECT name FROM categories");
    reply.send(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    reply.status(500).send({ error: errorMessage });
  }
});

fastify.get("/api/payment-methods", async (request, reply) => {
  try {
    const result = await db.all(
      "SELECT method_id, method_name FROM payment_methods"
    );
    reply.send(result);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    reply.status(500).send({ error: errorMessage });
  }
});

//Snippet 9: Configure Server to Handle Clean URLs

// Serve login page without .html extension
fastify.get("/login", (request, reply) => {
  const filePath = path.join(__dirname, "public", "login.html");
  fs.readFile(filePath, (err, data) => {
    if (err) {
      reply.status(500).send("Internal Server Error");
    } else {
      reply.type("text/html").send(data);
    }
  });
});

// Serve forget password page without .html extension
fastify.get("/forget-password", (request, reply) => {
  const filePath = path.join(__dirname, "public", "forget-password.html");
  fs.readFile(filePath, (err, data) => {
    if (err) {
      reply.status(500).send("Internal Server Error");
    } else {
      reply.type("text/html").send(data);
    }
  });
});

//Snippet 10: Login Endpoint: Handle login requests by verifying user credentials.

fastify.post("/login", async (request, reply) => {
  const { username, password } = request.body;
  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (user && bcrypt.compareSync(password, user.password)) {
      request.session.authenticated = true;
      reply.send({ success: true });
    } else {
      reply.send({ success: false });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    reply.send({ success: false });
  }
});

//Snippet 11: Password Reset Request Endpoint : Handle requests to send a password reset email.

fastify.post("/request-password-reset", async (request, reply) => {
  const { email } = request.body;
  try {
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (user) {
      const resetToken = generateResetToken();
      await db.run("UPDATE users SET reset_token = ? WHERE email = ?", [
        resetToken,
        email,
      ]);
      sendResetEmail(email, resetToken); // Implement sendResetEmail function
      reply.send({ success: true, message: "Reset email sent" });
    } else {
      reply.send({ success: false, message: "Email not found" });
    }
  } catch (error) {
    console.error("Error requesting password reset:", error);
    reply.send({ success: false });
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

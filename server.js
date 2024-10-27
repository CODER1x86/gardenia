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

// User data (replace with a proper database in production)
const users = [
  { username: "admin", password: bcrypt.hashSync("password", 10) },
];
// Setup email transport
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: "your-email@gmail.com",
    pass: "your-email-password",
  },
});

function sendResetEmail(email, token) {
  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Password Reset",
    text: `Please use the following token to reset your password: ${token}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Email sent: " + info.response);
  });
}
// Serve static files manually
fastify.get("/public/*", (request, reply) => {
  const filePath = path.join(__dirname, request.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      reply.status(500).send("Internal Server Error");
    } else {
      reply.type(getContentType(filePath)).send(data);
    }
  });
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html";
    case ".css":
      return "text/css";
    case ".js":
      return "application/javascript";
    case ".json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}

const errorMessage =
  "Whoops! Error connecting to the database–please try again!";

// Serve index.html for the home route
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

// Serve other HTML pages explicitly
const pages = [
  "budget-summary.html",
  "budget-details.html",
  "expense-report.html",
  "revenue-report.html",
  "index.html",
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
// API route to get expenses
fastify.get("/api/expenses", async (request, reply) => {
  let data = {};
  try {
    data.expenses = await db.getExpenses();
    if (!data.expenses) data.error = errorMessage;
  } catch (error) {
    console.error(error);
    data.error = errorMessage;
  }
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});

// Ensure this is the only definition of /api/data
fastify.get("/api/data", async (request, reply) => {
  let data = {};
  try {
    const revenueResult = await db.getRevenue();
    const expensesResult = await db.getExpensesSum();
    const balanceResult = await db.getBalance();

    data.availableBalance = balanceResult.starting_balance + revenueResult.totalRevenue - expensesResult.totalExpenses;
    data.totalRevenue = revenueResult.totalRevenue;
    data.totalExpenses = expensesResult.totalExpenses;

    reply.send(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    reply.status(500).send({ error: errorMessage });
  }
});

// API route to add a new expense
fastify.post("/api/expenses", async (request, reply) => {
  let data = {};
  const auth = authorized(request.headers.admin_key);
  if (!auth || !request.body || !request.body.expense) {
    data.success = false;
  } else {
    try {
      data.success = await db.addExpense(request.body.expense);
      if (data.success) {
        sendWhatsAppMessage(
          request.body.expense.phoneNumber,
          request.body.expense.unit
        );
      }
    } catch (error) {
      console.error(error);
      data.success = false;
    }
  }
  const status = data.success ? 201 : auth ? 400 : 401;
  reply.status(status).send(data);
});

// Helper function to authenticate the user key
const authorized = (key) => {
  return key && key === process.env.ADMIN_KEY;
};
// Authentication Routes
fastify.post("/register", async (request, reply) => {
  const { username, password, email } = request.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    await db.run(
      "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
      [username, hashedPassword, email]
    );
    reply.send({ success: true });
  } catch (error) {
    console.error("Error registering user:", error);
    reply.send({ success: false });
  }
});

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

fastify.post("/logout", (request, reply) => {
  request.session.authenticated = false;
  reply.send({ success: true });
});
fastify.get("/api/check-auth", (request, reply) => {
  const isAuthenticated = request.session.authenticated || false;
  reply.send({ authenticated: isAuthenticated });
});

fastify.post("/request-password-reset", async (request, reply) => {
  const { email } = request.body;
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
});

function generateResetToken() {
  return Math.random().toString(36).substr(2);
}
fastify.post("/reset-password", async (request, reply) => {
  const { email, resetToken, newPassword } = request.body;
  const user = await db.get(
    "SELECT * FROM users WHERE email = ? AND reset_token = ?",
    [email, resetToken]
  );
  if (user) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.run(
      "UPDATE users SET password = ?, reset_token = NULL WHERE email = ?",
      [hashedPassword, email]
    );
    reply.send({ success: true, message: "Password reset successful" });
  } else {
    reply.send({ success: false, message: "Invalid token or email" });
  }
});

fastify.addHook("preHandler", (request, reply, done) => {
  if (
    request.raw.url.startsWith("/protected") &&
    !request.session.authenticated
  ) {
    reply.status(401).send({ error: "Not authenticated" });
  } else {
    done();
  }
});

// Start the server
fastify.listen(
  { port: process.env.PORT || 3000, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);

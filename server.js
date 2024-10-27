const fastify = require("fastify")({ logger: false });
const path = require('path');
const fs = require('fs');
const db = require("./sqlite.js");
const { sendWhatsAppMessage } = require("./twilioIntegration");
const session = require('@fastify/session');
const cookie = require('@fastify/cookie');
const bcrypt = require('bcrypt');

fastify.register(cookie);
fastify.register(session, {
  secret: 'a super secret key that should be stored securely',
  cookie: { secure: false }, // Set to true in production
  saveUninitialized: false,
  resave: false
});

// User data (replace with a proper database in production)
const users = [{ username: 'admin', password: bcrypt.hashSync('password', 10) }];

// Serve static files manually
fastify.get("/public/*", (request, reply) => {
  const filePath = path.join(__dirname, request.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      reply.status(500).send('Internal Server Error');
    } else {
      reply.type(getContentType(filePath)).send(data);
    }
  });
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    default: return 'application/octet-stream';
  }
}

const errorMessage = "Whoops! Error connecting to the database–please try again!";

// Serve index.html for the home route
fastify.get("/", (request, reply) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      reply.status(500).send('Internal Server Error');
    } else {
      reply.type('text/html').send(data);
    }
  });
});

// Serve other HTML pages explicitly
const pages = ['budget-summary.html', 'budget-details.html', 'expense-report.html', 'revenue-report.html'];
pages.forEach(page => {
  fastify.get(`/${page}`, (request, reply) => {
    const filePath = path.join(__dirname, 'public', page);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reply.status(500).send('Internal Server Error');
      } else {
        reply.type('text/html').send(data);
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
        sendWhatsAppMessage(request.body.expense.phoneNumber, request.body.expense.unit);
      }
    } catch (error) {
      console.error(error);
      data.success = false;
    }
  }
  const status = data.success ? 201 : auth ? 400 : 401;
  reply.status(status).send(data);
});

// Login route
fastify.post('/login', (request, reply) => {
  const { username, password } = request.body;
  const user = users.find(u => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    request.session.authenticated = true;
    reply.send({ success: true });
  } else {
    reply.send({ success: false });
  }
});

// Logout route
fastify.post('/logout', (request, reply) => {
  request.session.authenticated = false;
  reply.send({ success: true });
});

// Middleware to protect routes
fastify.addHook('preHandler', (request, reply, done) => {
  if (request.raw.url.startsWith('/protected') && !request.session.authenticated) {
    reply.status(401).send({ error: 'Not authenticated' });
  } else {
    done();
  }
});

// Helper function to authenticate the user key
const authorized = key => {
  return key && key === process.env.ADMIN_KEY;
};

// Start the server
fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
});

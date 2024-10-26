const fastify = require("fastify")({ logger: false });
const path = require('path');
const fs = require('fs');
const db = require("./sqlite.js");
const { sendWhatsAppMessage } = require("./twilioIntegration");

fastify.register(require("@fastify/formbody"));

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
  data.expenses = await db.getExpenses();
  if (!data.expenses) data.error = errorMessage;
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
    data.success = await db.addExpense(request.body.expense);
    if (data.success) {
      sendWhatsAppMessage(request.body.expense.phoneNumber, request.body.expense.unit);
    }
  }
  const status = data.success ? 201 : auth ? 400 : 401;
  reply.status(status).send(data);
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

const fastify = require("fastify")({ logger: false });
const path = require('path');
const fs = require('fs');
const db = require("./sqlite.js");
const { sendWhatsAppMessage } = require("./twilioIntegration");
const session = require('@fastify/session');
const cookie = require('@fastify/cookie');
const bcrypt = require('bcrypt');

// Middleware setup
fastify.register(cookie);
fastify.register(session, {
  secret: 'a super secret key that should be stored securely',
  cookie: { secure: false },
  saveUninitialized: false,
  resave: false
});

fastify.register(require("@fastify/formbody"));

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

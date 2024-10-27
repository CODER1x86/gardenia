const fastify = require("fastify")({ logger: false });
const path = require("path");
const fs = require("fs");
const db = require("./sqlite.js");
const { sendWhatsAppMessage } = require("./twilioIntegration");
const session = require("@fastify/session");
const cookie = require("@fastify/cookie");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const errorMessage = "Whoops! Error connecting to the database–please try again!";
// Ensure 'db' has the necessary methods to interact with the SQLite database

module.exports = {
  getExpenses: async () => {
    try {
      return await db.all("SELECT * FROM expenses");
    } catch (dbError) {
      console.error("Error fetching expenses:", dbError);
    }
  },
  addExpense: async expense => {
    let success = false;
    try {
      success = await db.run("INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)", [
        expense.category,
        expense.item,
        expense.price,
        expense.expense_date,
        expense.last_updated
      ]);
    } catch (dbError) {
      console.error("Error adding expense:", dbError);
    }
    return success.changes > 0 ? true : false;
  },
  getRevenue: async () => {
    try {
      return await db.get("SELECT SUM(total_paid) AS totalRevenue FROM revenue");
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
      return await db.get("SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = strftime('%Y', 'now'))");
    } catch (dbError) {
      console.error("Error fetching balance:", dbError);
    }
  },
  // Add more methods for other operations as needed
};
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
      availableBalance: availableBalance
    });
  } catch (error) {
    console.error("Error fetching budget details:", error);
    reply.status(500).send({ error: errorMessage });
  }
});
fastify.post("/api/expense-input", async (request, reply) => {
  const { category, newCategory, item, amount, paymentDate } = request.body;
  const finalCategory = newCategory || category;

  try {
    if (newCategory) {
      await db.run("INSERT INTO categories (name) VALUES (?)", [newCategory]);
    }
    await db.run("INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)", [
      finalCategory,
      item,
      amount,
      paymentDate,
      new Date().toISOString()
    ]);

    reply.send({ success: true });
  } catch (error) {
    console.error("Error adding expense:", error);
    reply.status(500).send({ success: false, error: errorMessage });
  }
});
fastify.post("/api/revenue-input", async (request, reply) => {
  const { unitNumber, amount, paymentDate, paymentMethod } = request.body;

  try {
    await db.run("INSERT INTO payments (unit_id, year, month, amount, payment_date, method_id) VALUES (?, strftime('%Y', ?), strftime('%m', ?), ?, ?, ?)", [
      unitNumber,
      paymentDate,
      paymentDate,
      amount,
      paymentDate,
      paymentMethod
    ]);

    reply.send({ success: true });
  } catch (error) {
    console.error("Error adding revenue:", error);
    reply.status(500).send({ success: false, error: errorMessage });
  }
});
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
    const result = await db.all("SELECT method_id, method_name FROM payment_methods");
    reply.send(result);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    reply.status(500).send({ error: errorMessage });
  }
});

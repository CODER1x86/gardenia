const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const dbFile = path.join(__dirname, "./.data/database.db");

let db;

// Initialize and set up the database
const initializeDatabase = async () => {
  try {
    db = await dbWrapper.open({ filename: dbFile, driver: sqlite3.Database });
    console.log("Database initialized successfully");

    // Create tables if they don't exist
    await db.run(`CREATE TABLE IF NOT EXISTS owners (
      owner_id INTEGER PRIMARY KEY,
      owner_name TEXT NOT NULL,
      owner_phone TEXT NOT NULL,
      created_at TEXT
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS tenants (
      tenant_id INTEGER PRIMARY KEY,
      tenant_name TEXT,
      tenant_phone TEXT,
      created_at TEXT
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS units (
      unit_id INTEGER PRIMARY KEY,
      floor TEXT NOT NULL,
      unit_number INT UNIQUE NOT NULL,
      owner_id INTEGER,
      is_rented BOOLEAN,
      tenant_id INTEGER,
      last_updated TEXT,
      FOREIGN KEY (owner_id) REFERENCES owners(owner_id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS payment_methods (
      method_id INTEGER PRIMARY KEY,
      method_name TEXT NOT NULL UNIQUE
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS payments (
      payment_id INTEGER PRIMARY KEY,
      unit_id INTEGER,
      amount INT,
      payment_date TEXT,
      created_at TEXT,
      method_id INTEGER,
      FOREIGN KEY (unit_id) REFERENCES units(unit_id),
      FOREIGN KEY (method_id) REFERENCES payment_methods(method_id)
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS revenue (
      revenue_id INTEGER PRIMARY KEY,
      unit_id INTEGER,
      amount INT,
      payment_date TEXT,
      method_id INTEGER,
      FOREIGN KEY (unit_id) REFERENCES units(unit_id),
      FOREIGN KEY (method_id) REFERENCES payment_methods(method_id)
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS expenses (
      expense_id INTEGER PRIMARY KEY,
      unit_id INTEGER,
      category TEXT,
      item TEXT,
      price INT,
      expense_date TEXT,
      last_updated TEXT,
      receipt_photo BLOB
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS balance (
      balance_id INTEGER PRIMARY KEY,
      unit_id INTEGER,
      year INTEGER,
      starting_balance INT,
      FOREIGN KEY (unit_id) REFERENCES units(unit_id)
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      reset_token TEXT,
      created_at TEXT
    )`);
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

const getDb = () => db;
const getExpenses = async () => {
  try {
    return await db.all("SELECT * FROM expenses");
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};
const getRevenue = async (year) => {
  try {
    return await db.get("SELECT SUM(amount) AS totalRevenue FROM revenue WHERE strftime('%Y', payment_date) = ?", [year]);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    throw error;
  }
};
const getExpensesSum = async (year) => {
  try {
    return await db.get("SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?", [year]);
  } catch (error) {
    console.error("Error fetching total expenses:", error);
    throw error;
  }
};
const getBalance = async (year) => {
  try {
    return await db.get(
      `SELECT starting_balance
       FROM balance
       WHERE year = ?`, [year]
    );
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
};

// Module Exports
module.exports = { initializeDatabase, getDb, getExpenses, getRevenue, getExpensesSum, getBalance };

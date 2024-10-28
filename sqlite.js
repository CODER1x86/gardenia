// Imports and Definitions
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
    await db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER,
      year INTEGER,
      month INTEGER,
      amount REAL,
      payment_date TEXT,
      method_id INTEGER
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      item TEXT,
      price REAL,
      expense_date TEXT,
      last_updated TEXT
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS balance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_id INTEGER,
      starting_balance REAL
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS years (
      year_id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER UNIQUE
    )`);
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

// Return the database instance
const getDb = () => db;

// Fetch all expenses
const getExpenses = async () => {
  try {
    return await db.all("SELECT * FROM expenses");
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

// Insert a new expense
const addExpense = async (expense) => {
  try {
    const result = await db.run(
      "INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)",
      [expense.category, expense.item, expense.price, expense.expense_date, expense.last_updated]
    );
    return result.changes > 0;
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

// Calculate total revenue for the specified year
const getRevenue = async (year) => {
  try {
    return await db.get(
      "SELECT SUM(amount) AS totalRevenue FROM payments WHERE year = ?",
      [year]
    );
  } catch (error) {
    console.error("Error fetching revenue:", error);
    throw error;
  }
};

// Calculate total expenses for the specified year
const getExpensesSum = async (year) => {
  try {
    return await db.get(
      "SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?",
      [year]
    );
  } catch (error) {
    console.error("Error fetching total expenses:", error);
    throw error;
  }
};

// Retrieve starting balance for the specified year
const getBalance = async (year) => {
  try {
    return await db.get(
      `SELECT starting_balance 
       FROM balance 
       WHERE year_id = (SELECT year_id FROM years WHERE year = ?)`,
      [year]
    );
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
};

// Module Exports
module.exports = {
  getDb,
  initializeDatabase,
  getExpenses,
  addExpense,
  getRevenue,
  getExpensesSum,
  getBalance,
};

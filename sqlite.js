const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const dbFile = path.join(__dirname, "./.data/database.db");

let db;

// Initialize and set up database
const initializeDatabase = async () => {
  try {
    db = await dbWrapper.open({ filename: dbFile, driver: sqlite3.Database });
    console.log("Database initialized successfully");

    // Create tables if they don't exist
    await db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER,
      year INTEGER,
      month TEXT,
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
      year INTEGER
    )`);
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

const getExpenses = async () => {
  try {
    return await db.all("SELECT * FROM expenses");
  } catch (dbError) {
    console.error("Error fetching expenses:", dbError);
  }
};

const addExpense = async (expense) => {
  let success = false;
  try {
    success = await db.run(
      "INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)",
      [expense.category, expense.item, expense.price, expense.expense_date, expense.last_updated]
    );
  } catch (dbError) {
    console.error("Error adding expense:", dbError);
  }
  return success.changes > 0 ? true : false;
};

const getRevenue = async () => {
  try {
    return await db.get("SELECT SUM(total_paid) AS totalRevenue FROM revenue");
  } catch (dbError) {
    console.error("Error fetching revenue:", dbError);
  }
};

const getExpensesSum = async () => {
  try {
    return await db.get("SELECT SUM(price) AS totalExpenses FROM expenses");
  } catch (dbError) {
    console.error("Error fetching total expenses:", dbError);
  }
};

const getBalance = async () => {
  try {
    return await db.get("SELECT starting_balance FROM balance WHERE year_id = (SELECT year_id FROM years WHERE year = strftime('%Y', 'now'))");
  } catch (dbError) {
    console.error("Error fetching balance:", dbError);
  }
};

module.exports = {
  initializeDatabase,
  getExpenses,
  addExpense,
  getRevenue,
  getExpensesSum,
  getBalance
};

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const dbFile = path.join(__dirname, "./.data/database.db");

let db;

async function initializeDatabase() {
  db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  console.log("Database initialized successfully");

  // Create tables if they don't exist
  await Promise.all([
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER,
      year INTEGER,
      month TEXT,
      amount REAL,
      payment_date TEXT,
      method_id INTEGER
    )`),
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      item TEXT,
      price REAL,
      expense_date TEXT,
      last_updated TEXT
    )`),
    db.run(`CREATE TABLE IF NOT EXISTS balance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_id INTEGER,
      starting_balance REAL
    )`),
    db.run(`CREATE TABLE IF NOT EXISTS years (
      year_id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER
    )`)
  ]);

  return db;
}

module.exports = {
  initializeDatabase,
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
        [expense.category, expense.item, expense.price, expense.expense_date, expense.last_updated]
      );
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
  }
};

// Snippet 1: Definitions and Database Initialization
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const dbFile = path.join(__dirname, "./.data/database.db");
let db;

// Open database without table creation
dbWrapper.open({ filename: dbFile, driver: sqlite3.Database }).then(dBase => {
  db = dBase;
  console.log("Database initialized successfully");
}).catch(dbError => {
  console.error("Error initializing database:", dbError);
});

// Snippet 2: Database Methods - Expenses, Revenue, Summary, Balance
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
  },
  // Add more methods for other operations as needed
};

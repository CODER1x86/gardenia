const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");

const dbFile = path.join(__dirname, "./.data/database.db");
let db;

// Open database without table creation
dbWrapper
  .open({ filename: dbFile, driver: sqlite3.Database })
  .then((dBase) => {
    db = dBase;
    console.log("Database initialized successfully");
  })
  .catch((dbError) => {
    console.error("Error initializing database:", dbError);
  });

module.exports = {
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
      success = await db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT
  );
`);
    } catch (dbError) {
      console.error("Error adding expense:", dbError);
    }
    return success.changes > 0 ? true : false;
  },
  // Add more methods for other operations as needed
};

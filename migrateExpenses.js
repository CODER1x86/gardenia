const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbWrapper = require('sqlite');
const csvParser = require('csv-parser');

// SQLite database setup
const dbFile = "./data/database.db";
let db;

// Open database
dbWrapper.open({ filename: dbFile, driver: sqlite3.Database }).then(async dBase => {
  db = dBase;
  console.log("Database opened successfully");

  // Ensure expenses table exists
  await db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      item TEXT,
      price REAL,
      expense_date TEXT,
      last_updated TEXT
    );
  `);

  // Function to read CSV and insert data
  readAndInsertExpenseData('expenses.csv');
});

// Function to read CSV file and insert data into the expenses table
function readAndInsertExpenseData(filePath) {
  const data = [];
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', async () => {
      console.log(`CSV file successfully processed: ${filePath}`);
      for (let row of data) {
        await db.run(
          `INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)`,
          [row.category, row.item, row.price, row.expense_date, row.last_updated]
        );
      }
      console.log("Expenses data successfully inserted into database.");
    });
}

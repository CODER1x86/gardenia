const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbWrapper = require('sqlite');
const csvParser = require('csv-parser');

// SQLite database setup
const dbFile = "./.data/gardenia.db";
let db;

// Open database
dbWrapper.open({ filename: dbFile, driver: sqlite3.Database }).then(async dBase => {
  db = dBase;
  console.log("Database opened successfully");

  // Ensure tables exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS revenue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER,
      year INTEGER,
      month TEXT,
      amount REAL,
      date TEXT,
      method TEXT,
      FOREIGN KEY(unit_id) REFERENCES units(id)
    );
  `);
  
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
  readAndInsertData('path/to/revenue.csv', 'revenue');
  readAndInsertData('path/to/expenses.csv', 'expenses');
});
// Function to read CSV file and insert data into corresponding table
function readAndInsertData(filePath, tableName) {
  const data = [];
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', async () => {
      console.log(`CSV file successfully processed: ${filePath}`);
      for (let row of data) {
        if (tableName === 'revenue') {
          await db.run(
            `INSERT INTO revenue (unit_id, year, month, amount, date, method) VALUES (?, ?, ?, ?, ?, ?)`,
            [row.unit_id, row.year, row.month, row.amount, row.date, row.method]
          );
        } else if (tableName === 'expenses') {
          await db.run(
            `INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)`,
            [row.category, row.item, row.price, row.expense_date, row.last_updated]
          );
        }
      }
      console.log(`${tableName} data successfully inserted into database.`);
    });
}

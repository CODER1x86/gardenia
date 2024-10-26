const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbWrapper = require('sqlite');
const csvParser = require('csv-parser');

const dbFile = "./.data/database.db";
let db;

// Open database and create expenses table if it does not exist
dbWrapper.open({ filename: dbFile, driver: sqlite3.Database }).then(async dBase => {
  db = dBase;
  console.log("Database opened successfully");

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

  readAndInsertExpenseData('expenses.csv');
}).catch(err => console.error('Error opening database:', err));
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
        const expense_date = row['Expense Date'] ? row['Expense Date'] : 'Unknown';
        const last_updated = row['Last Updated'] ? row['Last Updated'] : 'Unknown';

        if (row.Category && row.Item && row.Price) {
          await db.run(
            `INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)`,
            [row.Category, row.Item, row.Price, expense_date, last_updated]
          );
        } else {
          console.error('Missing required fields for row:', row);
        }
      }
      console.log("Expenses data successfully inserted into database.");
    });
}

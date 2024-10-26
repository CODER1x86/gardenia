const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbWrapper = require('sqlite');
const csvParser = require('csv-parser');

const dbFile = "./.data/database.db";
let db;

dbWrapper.open({ filename: dbFile, driver: sqlite3.Database }).then(async dBase => {
  db = dBase;
  console.log("Database opened successfully");

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

  readAndInsertRevenueData('revenue.csv');
});
function readAndInsertRevenueData(filePath) {
  const data = [];
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => {
      data.push(row);
    })
    .on('end', async () => {
      console.log(`CSV file successfully processed: ${filePath}`);
      for (let row of data) {
        const year = row.Year;

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        
        for (let month of months) {
          if (row[`${month} Amount`] && row[`${month} Date`] && row[`${month} Method`]) {
            await db.run(
              `INSERT INTO revenue (unit_id, year, month, amount, date, method) VALUES (?, ?, ?, ?, ?, ?)`,
              [row['Unit Number'], year, month, row[`${month} Amount`], row[`${month} Date`], row[`${month} Method`]]
            );
          }
        }
      }
      console.log("Revenue data successfully inserted into database.");
    });
}

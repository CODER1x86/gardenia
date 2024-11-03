const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

let db = new sqlite3.Database('./.data/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

fs.createReadStream('./expenses.csv')
  .pipe(csv())
  .on('data', (row) => {
      db.run(`INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)`, 
          [row.category, row.item, row.price, row.expense_date, row.last_updated], 
          (err) => {
              if (err) {
                  console.error(err.message);
              }
          }
      );
  })
  .on('end', () => {
      console.log('CSV file successfully processed and data imported.');
      db.close((err) => {
          if (err) {
              console.error(err.message);
          }
          console.log('Closed the database connection.');
      });
  });

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

let db = new sqlite3.Database('./.data/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

fs.createReadStream('./payments.csv')
  .pipe(csv())
  .on('data', (row) => {
      db.run(`INSERT INTO payments (unit_id, year, month, amount, payment_date, method_id) VALUES (?, ?, ?, ?, ?, ?)`, 
          [row.unit_id, row.year, row.month, row.amount, row.payment_date, row.method_id], 
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

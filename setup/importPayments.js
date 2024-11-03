const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

const db = new sqlite3.Database('./.data/database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

fs.createReadStream('./payments.csv')
    .pipe(csv())
    .on('data', (row) => {
        const fillDate = (month, year) => `${year}-${String(new Date(`${year}-${month}-01`).getMonth() + 1).padStart(2, '0')}-01`;

        const unit_id = row['unit_id'];
        const year = row['year'];
        const month = row['month'];
        const amount = row['amount'] || 0;  // Default to 0 if amount is missing
        const date = row['payment_date'] || fillDate(month, year);
        const method_id = row['method_id'] || 1; // Default to method_id 1 if missing

        console.log(`Attempting to insert: unit_id=${unit_id}, year=${year}, month=${month}, amount=${amount}, date=${date}, method_id=${method_id}`);

        db.run(`INSERT INTO payments (unit_id, amount, payment_date, created_at, method_id)
                VALUES (?, ?, ?, ?, ?)`,
               [unit_id, amount, date, new Date().toISOString(), method_id],
               (err) => {
                   if (err) {
                       console.error(`Error inserting payment: unit_id=${unit_id}, amount=${amount}, date=${date}, method_id=${method_id}`, err.message);
                   } else {
                       console.log(`Successfully inserted payment: unit_id=${unit_id}, amount=${amount}, date=${date}, method_id=${method_id}`);
                   }
               });
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

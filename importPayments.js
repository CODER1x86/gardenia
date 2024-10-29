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

        // Process and insert payments
        const insertPayment = (unit_id, amount, date, method_id, year, month) => {
            const payment_date = date || fillDate(month, year);
            db.run(`INSERT INTO payments (unit_id, amount, payment_date, created_at, method_id)
                    VALUES (?, ?, ?, ?, ?)`,
                   [unit_id, amount, payment_date, new Date().toISOString(), method_id],
                   (err) => {
                       if (err) {
                           console.error(`Error inserting payment: ${err.message}`);
                       } else {
                           console.log(`Payment inserted: unit_id=${unit_id}, amount=${amount}, payment_date=${payment_date}, method_id=${method_id}`);
                       }
                   });
        };

        // List of months to process
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        months.forEach(month => {
            const amount = row[`${month} Amount`];
            const date = row[`${month} Date`];
            const method_id = row[`${month} Method`];

            if (amount) {
                insertPayment(unit_id, amount, date, method_id, year, month);
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

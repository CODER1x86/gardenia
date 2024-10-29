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

        const insertPaymentMethod = `INSERT OR IGNORE INTO payment_methods (method_id) VALUES (?)`;

        const unit_id = row['unit_id'];
        const year = row['year'];

        const monthData = {
            'January': row['January'],
            'February': row['February'],
            'March': row['March'],
            'April': row['April'],
            'May': row['May'],
            'June': row['June'],
            'July': row['July'],
            'August': row['August'],
            'September': row['September'],
            'October': row['October'],
            'November': row['November'],
            'December': row['December']
        };

        for (const month in monthData) {
            const amount = row[`${month} Amount`];
            const date = row[`${month} Date`] || fillDate(month, year);
            const method_id = row[`${month} Method`];

            if (amount) {
                console.log(`Inserting payment: unit_id=${unit_id}, amount=${amount}, date=${date}, method_id=${method_id}`);
                
                db.run(insertPaymentMethod, [method_id], (err) => {
                    if (err) {
                        console.error(err.message);
                    }
                    db.run(`INSERT INTO payments (unit_id, amount, payment_date, created_at, method_id)
                            VALUES (?, ?, ?, ?, ?)`, [unit_id, amount, date, new Date().toISOString(), method_id], (err) => {
                        if (err) {
                            console.error(err.message);
                        }
                    });
                });
            }
        }
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

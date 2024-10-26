const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Ensure .data directory exists
const dir = './.data';
if (!fs.existsSync(dir)){
  fs.mkdirSync(dir);
}

// Create database file
let db = new sqlite3.Database('./.data/database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Closed the database connection.');
});

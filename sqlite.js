const fs = require("fs");
const dbFile = "./.data/gardenia.db"; // Use your specific database file name
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");

let db;

//SQLite wrapper for async / await connections
dbWrapper.open({ filename: dbFile, driver: sqlite3.Database }).then(async dBase => {
  db = dBase;
  try {
    if (!exists) {
      // Create your tables
      await db.run(`
        CREATE TABLE IF NOT EXISTS floors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT
        );
      `);

      await db.run(`
        CREATE TABLE IF NOT EXISTS units (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          floor_id INTEGER,
          unit_number TEXT UNIQUE,
          owner_id INTEGER,
          tenant_id INTEGER,
          FOREIGN KEY(floor_id) REFERENCES floors(id),
          FOREIGN KEY(owner_id) REFERENCES owners(id),
          FOREIGN KEY(tenant_id) REFERENCES tenants(id)
        );
      `);

      // Add more tables as needed
    }
    console.log("Database initialized successfully");
  } catch (dbError) {
    console.error(dbError);
  }
});

module.exports = {
  // Add your methods for interacting with the database here
};

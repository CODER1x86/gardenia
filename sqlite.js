const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");

const dbFile = path.join(__dirname, "./.data/database.db");
const exists = fs.existsSync(dbFile);
let db;

// Open database and create tables if they do not exist
dbWrapper.open({ filename: dbFile, driver: sqlite3.Database }).then(async dBase => {
  db = dBase;
  try {
    if (!exists) {
      console.log("Creating tables...");
      await createTables();
    }
    console.log("Database initialized successfully");
  } catch (dbError) {
    console.error("Error initializing database:", dbError);
  }
});
// Function to create tables
async function createTables() {
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

  await db.run(`
    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT
    );
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT
    );
  `);

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

  // Initial opening balance for 2024
  const openingBalance = 12362;
  await db.run(`INSERT INTO revenue (unit_id, year, month, amount) VALUES (?, ?, ?, ?)`, [null, 2024, "Opening Balance", openingBalance]);
  console.log("Tables created successfully");
}
module.exports = {
  getExpenses: async () => {
    try {
      return await db.all("SELECT * FROM expenses");
    } catch (dbError) {
      console.error("Error fetching expenses:", dbError);
    }
  },

  addExpense: async expense => {
    let success = false;
    try {
      success = await db.run("INSERT INTO expenses (category, item, price, expense_date, last_updated) VALUES (?, ?, ?, ?, ?)", [
        expense.category,
        expense.item,
        expense.price,
        expense.expense_date,
        expense.last_updated
      ]);
    } catch (dbError) {
      console.error("Error adding expense:", dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Add more methods for other operations as needed
};

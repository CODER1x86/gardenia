const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const dbFile = path.join(__dirname, "./.data/database.db");

let db;

// Initialize and set up the database
const initializeDatabase = async () => {
  try {
    db = await dbWrapper.open({ filename: dbFile, driver: sqlite3.Database });
    console.log("Database initialized successfully");

    // Create tables if they don't exist
    await db.run(`CREATE TABLE IF NOT EXISTS owners (
      owner_id INTEGER PRIMARY KEY,
      owner_name TEXT NOT NULL,
      owner_phone TEXT NOT NULL,
      created_at TEXT
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS tenants (
      tenant_id INTEGER PRIMARY KEY,
      tenant_name TEXT,
      tenant_phone TEXT,
      created_at TEXT
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS units (
      unit_id INTEGER PRIMARY KEY,
      floor TEXT NOT NULL,
      unit_number INT UNIQUE NOT NULL,
      owner_id INTEGER,
      is_rented BOOLEAN,
      tenant_id INTEGER,
      last_updated TEXT,
      FOREIGN KEY (owner_id) REFERENCES owners(owner_id),
      FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id)
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS payment_methods (
      method_id INTEGER PRIMARY KEY,
      method_name TEXT NOT NULL UNIQUE
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS revenue (
      revenue_id INTEGER PRIMARY KEY,
      unit_id INTEGER,
      amount INT,
      payment_date TEXT,
      method_id INTEGER,
      FOREIGN KEY (unit_id) REFERENCES units(unit_id),
      FOREIGN KEY (method_id) REFERENCES payment_methods(method_id)
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS expenses (
      expense_id INTEGER PRIMARY KEY,
      category TEXT,
      item TEXT,
      price INT,
      expense_date TEXT,
      last_updated TEXT,
      unit_id INTEGER REFERENCES units(unit_id),
      receipt_photo BLOB
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS inventory (
      inventory_id INTEGER PRIMARY KEY,
      expense_id INTEGER REFERENCES expenses(expense_id),
      location TEXT,
      usage_date TEXT,
      last_updated TEXT,
      status TEXT
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      reset_token TEXT,
      created_at TEXT
    )`);

    await db.run(`CREATE TABLE IF NOT EXISTS balance (
      balance_id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      starting_balance INT NOT NULL,
      total_revenue INT NOT NULL,
      total_expenses INT NOT NULL,
      available_balance INT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create indexes
    await db.run("CREATE INDEX IF NOT EXISTS idx_payment_date ON revenue(payment_date)");
    await db.run("CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(expense_date)");

  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

const getDb = () => {
  console.log("Fetching database instance");
  return db;
};

// Helper function to run database queries with parameterized statements
const dbQuery = async (query, params = []) => {
  console.log(`Running query: ${query} with params: ${params}`);
  return new Promise((resolve, reject) => {
    db.all(query, params, (error, rows) => {
      if (error) {
        console.error("Error running query:", error);
        reject(error);
      } else {
        console.log("Query result:", rows);
        resolve(rows);
      }
    });
  });
};

const getExpenses = async () => {
  try {
    console.log("Fetching expenses");
    const expenses = await dbQuery("SELECT * FROM expenses");
    console.log("Expenses fetched:", expenses);
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

const getRevenue = async (year) => {
  try {
    console.log(`Fetching total revenue for year ${year}`);
    const result = await dbQuery("SELECT SUM(amount) AS totalRevenue FROM revenue WHERE strftime('%Y', payment_date) = ?", [year]);
    console.log(`Revenue result for year ${year}:`, result);
    return result[0]; // Assuming we get a single row
  } catch (error) {
    console.error("Error fetching revenue:", error);
    throw error;
  }
};

const getExpensesSum = async (year) => {
  try {
    console.log(`Fetching total expenses for year ${year}`);
    const result = await dbQuery("SELECT SUM(price) AS totalExpenses FROM expenses WHERE strftime('%Y', expense_date) = ?", [year]);
    console.log(`Expenses result for year ${year}:`, result);
    return result[0]; // Assuming we get a single row
  } catch (error) {
    console.error("Error fetching total expenses:", error);
    throw error;
  }
};

const getInventory = async () => {
  try {
    console.log("Fetching inventory");
    const inventory = await dbQuery("SELECT * FROM inventory");
    console.log("Inventory fetched:", inventory);
    return inventory;
  } catch (error) {
    console.error("Error fetching inventory:", error);
    throw error;
  }
};

const addInventoryItem = async (expense_id, location, usage_date, status) => {
  try {
    console.log(`Adding inventory item with expense_id: ${expense_id}, location: ${location}, usage_date: ${usage_date}, status: ${status}`);
    await db.run(
      "INSERT INTO inventory (expense_id, location, usage_date, last_updated, status) VALUES (?, ?, ?, ?, ?)",
      [expense_id, location, usage_date, new Date().toISOString(), status]
    );
    console.log("Inventory item added");
  } catch (error) {
    console.error("Error adding inventory item:", error);
    throw error;
  }
};

const getStartingBalance = async (year) => {
  try {
    console.log(`Fetching starting balance for year ${year}`);
    if (year === 2024) {
      return 12362; // Manually set for the initial year
    }
    const previousYear = year - 1;
    const result = await dbQuery(`
      SELECT
        (SELECT SUM(amount) FROM revenue WHERE strftime('%Y', payment_date) = ?) -
        (SELECT SUM(price) FROM expenses WHERE strftime('%Y', expense_date) = ?) AS availableBalance
    `, [previousYear, previousYear]);
    console.log(`Starting balance result for year ${year}:`, result);
    return result[0].availableBalance;
  } catch (error) {
    console.error("Error fetching starting balance:", error);
    throw error;
  }
};

const calculateAndInsertBalance = async (year) => {
  try {
    console.log(`Calculating and inserting balance for year ${year}`);
    const startingBalance = await getStartingBalance(year);
    const totalRevenue = (await getRevenue(year)).totalRevenue || 0;
    const totalExpenses = (await getExpensesSum(year)).totalExpenses || 0;
    const availableBalance = startingBalance + totalRevenue - totalExpenses;
    await db.run(`INSERT INTO balance (year, starting_balance, total_revenue, total_expenses, available_balance) VALUES (?, ?, ?, ?, ?)`, 
       [year, startingBalance, totalRevenue, totalExpenses, availableBalance]);
    console.log(`Inserted balance for year ${year}`);
    return availableBalance;
  } catch (error) {
    console.error("Error calculating and inserting balance:", error);
    throw error;
  }
};

// Module Exports
module.exports = {
  initializeDatabase,
  getDb,
  getExpenses,
  getRevenue,
  getExpensesSum,
  getInventory,
  addInventoryItem,
  getStartingBalance,
  calculateAndInsertBalance // Add this to exports
};

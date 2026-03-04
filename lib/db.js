import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Resolve the database file path relative to the project root
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "wardrobe.db");

// Ensure the data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Singleton database connection for the process
let db;

/**
 * Get or create the singleton database connection
 * and ensure the schema is initialized.
 */
function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma("journal_mode = WAL");
        db.pragma("foreign_keys = ON");
        initSchema(db);
    }
    return db;
}

/**
 * Initialize the database schema if it doesn't exist yet.
 */
function initSchema(database) {
    database.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      brand TEXT DEFAULT '',
      purchase_date TEXT DEFAULT '',
      size TEXT DEFAULT '',
      color TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export default getDb;

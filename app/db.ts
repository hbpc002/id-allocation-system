import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'employee_ids.db');
const db = new Database(dbPath);

// db.pragma('journal_mode = WAL'); // Commented out to avoid disk I/O error

db.exec(`
  CREATE TABLE IF NOT EXISTS allocated_ids (
    id INTEGER PRIMARY KEY,
    uniqueSessionId TEXT NOT NULL UNIQUE,
    allocationTime TEXT NOT NULL,
    ipAddress TEXT NOT NULL,
    expiresAt TEXT NOT NULL
  );
 
  CREATE TABLE IF NOT EXISTS employee_pool (
    id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'available',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
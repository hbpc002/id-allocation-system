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
  
  CREATE UNIQUE INDEX IF NOT EXISTS idx_allocated_ids_ipAddress ON allocated_ids (ipAddress);
  
  CREATE TABLE IF NOT EXISTS passwords (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Insert default password into database (if not exists)
const defaultPassword = 'root123';
const existingPassword = db.prepare('SELECT value FROM passwords WHERE key = ?').get('login_password');
if (!existingPassword) {
  db.prepare('INSERT INTO passwords (key, value) VALUES (?, ?)').run('login_password', defaultPassword);
}
export default db;
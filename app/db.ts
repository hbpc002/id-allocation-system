import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 确定数据目录路径，优先使用环境变量，否则使用默认路径
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'employee_ids.db');
const db = new Database(dbPath);

// 在Docker环境中启用WAL模式以提高性能
if (process.env.NODE_ENV === 'production') {
  db.pragma('journal_mode = WAL');
}

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
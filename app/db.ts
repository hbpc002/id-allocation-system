import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  // 确定数据目录路径，优先使用环境变量，否则使用默认路径
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');

  // 确保数据目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'employee_ids.db');
  _db = new Database(dbPath);

  // 在Docker环境中启用WAL模式以提高性能
  if (process.env.NODE_ENV === 'production') {
    _db.pragma('journal_mode = WAL');
  }

  // 创建表结构
  _db.exec(`
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
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_allocated_ids_ipAddress ON allocated_ids (ipAddress);

    CREATE TABLE IF NOT EXISTS passwords (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      sessionId TEXT PRIMARY KEY,
      loginTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastActivity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 插入默认密码
  const defaultPassword = 'root123';
  const existingPassword = _db.prepare('SELECT value FROM passwords WHERE key = ?').get('login_password');
  if (!existingPassword) {
    _db.prepare('INSERT INTO passwords (key, value) VALUES (?, ?)').run('login_password', defaultPassword);
  }

  // 迁移：添加 updatedAt 字段
  try {
    _db.prepare('ALTER TABLE employee_pool ADD COLUMN updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP').run();
  } catch {
    // 字段已存在，忽略
  }

  return _db;
}

// 导出获取数据库实例的函数
export default getDb;
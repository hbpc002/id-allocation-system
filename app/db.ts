import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  // 确定数据目录路径，优先使用环境变量，否则使用默认路径
  // Render 环境使用 /tmp 目录（有写入权限）
  let dataDir = process.env.DATA_DIR;
  if (!dataDir) {
    if (process.env.RENDER === 'true') {
      dataDir = '/tmp/data';
    } else {
      dataDir = path.join(process.cwd(), 'data');
    }
  }

  console.log('Database directory:', dataDir);

  // 确保数据目录存在
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory:', dataDir);
    }
  } catch (error) {
    console.error('Failed to create data directory:', error);
    throw error;
  }

  const dbPath = path.join(dataDir, 'employee_ids.db');
  console.log('Database path:', dbPath);

  try {
    _db = new Database(dbPath);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }

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

    -- 励志名言表
    CREATE TABLE IF NOT EXISTS motivational_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote TEXT NOT NULL,
      source TEXT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 系统配置表
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 插入默认密码
  const defaultPassword = 'root123';
  const existingPassword = _db.prepare('SELECT value FROM passwords WHERE key = ?').get('login_password');
  if (!existingPassword) {
    _db.prepare('INSERT INTO passwords (key, value) VALUES (?, ?)').run('login_password', defaultPassword);
  }

  // 插入默认系统配置（0小时 = 0ms，每次都显示）
  const existingQuoteInterval = _db.prepare('SELECT value FROM system_config WHERE key = ?').get('quote_popup_interval');
  if (!existingQuoteInterval) {
    _db.prepare('INSERT INTO system_config (key, value) VALUES (?, ?)').run('quote_popup_interval', '0');
  }

  // 迁移：添加 updatedAt 字段（检查是否存在）
  const tableInfo = _db.prepare("PRAGMA table_info(employee_pool)").all() as Array<{ name: string }>;
  const hasUpdatedAt = tableInfo.some(col => col.name === 'updatedAt');

  if (!hasUpdatedAt) {
    console.log('[Migration] Adding updatedAt column to employee_pool table');
    // SQLite 不支持添加带有非恒定默认值的列，所以先添加可为空的列
    _db.prepare('ALTER TABLE employee_pool ADD COLUMN updatedAt TIMESTAMP').run();
    // 更新现有行的值为当前时间
    _db.prepare('UPDATE employee_pool SET updatedAt = datetime(\'now\') WHERE updatedAt IS NULL').run();
    console.log('[Migration] updatedAt column added successfully');
  }

  return _db;
}

// 导出获取数据库实例的函数
export default getDb;

// 重置数据库单例（仅用于测试）
export function resetDb() {
  if (_db) {
    try {
      _db.close();
    } catch {
      // Ignore close errors
    }
  }
  _db = null;
}
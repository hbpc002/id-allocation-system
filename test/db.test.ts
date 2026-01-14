import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Test database path
const TEST_DB_DIR = path.join(__dirname, '../data/test');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'employee_ids.db');

// Helper to reset database
async function resetDatabase() {
  const dbModule = await import('../app/db.ts');
  if (typeof dbModule.resetDb === 'function') {
    dbModule.resetDb();
  }

  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
  }

  process.env.DATA_DIR = TEST_DB_DIR;
}

// Helper to get fresh db instance
async function getFreshDb() {
  const module = await import('../app/db.ts');
  return module.default();
}

describe('Database Module', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
    delete process.env.DATA_DIR;
    delete process.env.NODE_ENV;
  });

  it('should create database directory if it does not exist', async () => {
    expect(fs.existsSync(TEST_DB_DIR)).toBe(false);

    await getFreshDb();

    expect(fs.existsSync(TEST_DB_DIR)).toBe(true);
  });

  it('should create database file', async () => {
    await getFreshDb();

    expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
  });

  it('should create all required tables', async () => {
    const db = await getFreshDb();

    // Check that tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `).all() as { name: string }[];

    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('allocated_ids');
    expect(tableNames).toContain('employee_pool');
    expect(tableNames).toContain('passwords');
    expect(tableNames).toContain('admin_sessions');
    expect(tableNames).toContain('motivational_quotes');
    expect(tableNames).toContain('system_config');
  });

  it('should insert default password', async () => {
    const db = await getFreshDb();

    const result = db.prepare('SELECT value FROM passwords WHERE key = ?').get('login_password') as { value: string } | undefined;

    expect(result).toBeDefined();
    expect(result?.value).toBe('root123');
  });

  it('should insert default quote interval config', async () => {
    const db = await getFreshDb();

    const result = db.prepare('SELECT value FROM system_config WHERE key = ?').get('quote_popup_interval') as { value: string } | undefined;

    expect(result).toBeDefined();
    expect(result?.value).toBe('86400000'); // 24 hours in milliseconds
  });

  it('should return existing database instance on subsequent calls', async () => {
    const db1 = await getFreshDb();
    const db2 = await getFreshDb();

    expect(db1).toBe(db2);
  });

  it('should handle production environment with WAL mode', async () => {
    process.env.NODE_ENV = 'production';

    const db = await getFreshDb();

    const result = db.pragma('journal_mode') as [{ journal_mode: string }];
    expect(result[0].journal_mode).toBe('wal');
  });

  it('should use custom data directory from environment variable', async () => {
    const customDir = path.join(__dirname, '../data/custom');
    process.env.DATA_DIR = customDir;

    await getFreshDb();

    expect(fs.existsSync(path.join(customDir, 'employee_ids.db'))).toBe(true);

    // Cleanup
    if (fs.existsSync(customDir)) {
      fs.rmSync(customDir, { recursive: true, force: true });
    }
  });

  it('should create allocated_ids table with correct schema', async () => {
    const db = await getFreshDb();

    const result = db.prepare(`
      PRAGMA table_info(allocated_ids)
    `).all() as Array<{ name: string; type: string; notnull: number; pk: number }>;

    const columns = result.reduce((acc, col) => {
      acc[col.name] = col;
      return acc;
    }, {} as Record<string, any>);

    expect(columns.id).toBeDefined();
    expect(columns.id.pk).toBe(1); // Primary key
    expect(columns.uniqueSessionId).toBeDefined();
    expect(columns.allocationTime).toBeDefined();
    expect(columns.ipAddress).toBeDefined();
    expect(columns.expiresAt).toBeDefined();
  });

  it('should create employee_pool table with correct schema', async () => {
    const db = await getFreshDb();

    const result = db.prepare(`
      PRAGMA table_info(employee_pool)
    `).all() as Array<{ name: string; type: string; notnull: number; pk: number }>;

    const columns = result.reduce((acc, col) => {
      acc[col.name] = col;
      return acc;
    }, {} as Record<string, any>);

    expect(columns.id).toBeDefined();
    expect(columns.id.pk).toBe(1);
    expect(columns.status).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it('should create unique index on ipAddress in allocated_ids', async () => {
    const db = await getFreshDb();

    const indices = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='index'
      AND tbl_name='allocated_ids'
    `).all() as { name: string }[];

    const indexNames = indices.map(i => i.name);
    expect(indexNames).toContain('idx_allocated_ids_ipAddress');
  });
});

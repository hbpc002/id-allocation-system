import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const TEST_DB_DIR = path.join(__dirname, '../data/test');

// Helper to reset database
async function resetDatabase() {
  // Reset the db singleton
  const dbModule = await import('../app/db.ts');
  if (typeof dbModule.resetDb === 'function') {
    dbModule.resetDb();
  }

  // Delete test database files
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
  }

  // Set environment
  process.env.DATA_DIR = TEST_DB_DIR;
}

// Helper to get fresh service functions
async function getServiceFunctions() {
  return await import('../app/id-allocation-service.ts');
}

describe('ID Allocation Service', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
    delete process.env.DATA_DIR;
  });

  describe('Employee Pool Management', () => {
    describe('importEmployeeIds', () => {
      it('should import multiple employee IDs', async () => {
        const { importEmployeeIds, getAllEmployeeIds } = await getServiceFunctions();
        const result = importEmployeeIds([1001, 1002, 1003]);

        expect(result.success).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.errors).toHaveLength(0);

        const allIds = getAllEmployeeIds();
        expect(allIds).toHaveLength(3);
      });

      it('should skip duplicate IDs', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([1001, 1002]);

        const result = importEmployeeIds([1002, 1003]);

        expect(result.success).toBe(1); // Only 1003 is new
        expect(result.failed).toBe(1); // 1002 is duplicate
        expect(result.errors).toContain('工号 1002 已存在');
      });

      it('should handle empty array', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        const result = importEmployeeIds([]);

        expect(result.success).toBe(0);
        expect(result.failed).toBe(0);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('addEmployeeId', () => {
      it('should add a single employee ID', async () => {
        const { addEmployeeId, getAllEmployeeIds } = await getServiceFunctions();
        const result = addEmployeeId(2001);

        expect(result.success).toBe(true);

        const allIds = getAllEmployeeIds();
        expect(allIds.find(id => id.id === 2001)).toBeDefined();
      });

      it('should fail when adding duplicate ID', async () => {
        const { addEmployeeId } = await getServiceFunctions();
        addEmployeeId(2001);
        const result = addEmployeeId(2001);

        expect(result.success).toBe(false);
        expect(result.error).toContain('已存在');
      });
    });

    describe('deleteEmployeeId', () => {
      it('should delete an employee ID', async () => {
        const { addEmployeeId, deleteEmployeeId, getAllEmployeeIds } = await getServiceFunctions();
        addEmployeeId(3001);
        const result = deleteEmployeeId(3001);

        expect(result.success).toBe(true);

        const allIds = getAllEmployeeIds();
        expect(allIds.find(id => id.id === 3001)).toBeUndefined();
      });

      it('should fail to delete non-existent ID', async () => {
        const { deleteEmployeeId } = await getServiceFunctions();
        const result = deleteEmployeeId(9999);

        expect(result.success).toBe(false);
        expect(result.error).toContain('不存在');
      });

      it('should fail to delete allocated ID', async () => {
        const { addEmployeeId, allocateId, deleteEmployeeId } = await getServiceFunctions();
        // Setup: add ID and allocate it
        addEmployeeId(3002);
        allocateId('192.168.1.100');

        const result = deleteEmployeeId(3002);

        expect(result.success).toBe(false);
        expect(result.error).toContain('正在使用中');
      });
    });

    describe('updateEmployeeIdStatus', () => {
      it('should update ID status to disabled', async () => {
        const { addEmployeeId, updateEmployeeIdStatus, getAllEmployeeIds } = await getServiceFunctions();
        addEmployeeId(4001);
        const result = updateEmployeeIdStatus(4001, 'disabled');

        expect(result.success).toBe(true);

        const allIds = getAllEmployeeIds();
        const idInfo = allIds.find(id => id.id === 4001);
        expect(idInfo?.status).toBe('disabled');
      });

      it('should update ID status to available', async () => {
        const { addEmployeeId, updateEmployeeIdStatus, getAllEmployeeIds } = await getServiceFunctions();
        addEmployeeId(4001);
        updateEmployeeIdStatus(4001, 'disabled');
        const result = updateEmployeeIdStatus(4001, 'available');

        expect(result.success).toBe(true);

        const allIds = getAllEmployeeIds();
        const idInfo = allIds.find(id => id.id === 4001);
        expect(idInfo?.status).toBe('available');
      });

      it('should fail for non-existent ID', async () => {
        const { updateEmployeeIdStatus } = await getServiceFunctions();
        const result = updateEmployeeIdStatus(9999, 'disabled');

        expect(result.success).toBe(false);
        expect(result.error).toContain('不存在');
      });

      it('should fail to enable allocated ID', async () => {
        const { addEmployeeId, allocateId, updateEmployeeIdStatus } = await getServiceFunctions();
        addEmployeeId(4002);
        allocateId('192.168.1.100');
        updateEmployeeIdStatus(4002, 'disabled');

        const result = updateEmployeeIdStatus(4002, 'available');

        expect(result.success).toBe(false);
        expect(result.error).toContain('正在使用中');
      });
    });

    describe('getAllEmployeeIds', () => {
      it('should return all employee IDs with their status', async () => {
        const { importEmployeeIds, updateEmployeeIdStatus, getAllEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([5001, 5002, 5003]);
        updateEmployeeIdStatus(5003, 'disabled');

        const result = getAllEmployeeIds();

        expect(result).toHaveLength(3);
        expect(result.find(r => r.id === 5001)?.status).toBe('available');
        expect(result.find(r => r.id === 5003)?.status).toBe('disabled');
      });

      it('should return empty array when no IDs exist', async () => {
        const { getAllEmployeeIds } = await getServiceFunctions();
        const result = getAllEmployeeIds();

        expect(result).toHaveLength(0);
      });
    });

    describe('searchEmployeeIds', () => {
      it('should find IDs matching query', async () => {
        const { importEmployeeIds, searchEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([6001, 6002, 6100, 7000]);

        const results = searchEmployeeIds('60');

        expect(results).toHaveLength(2); // 6001, 6002
        expect(results.map(r => r.id).sort()).toEqual([6001, 6002]);
      });

      it('should filter by status', async () => {
        const { importEmployeeIds, updateEmployeeIdStatus, searchEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([6001, 6002]);
        updateEmployeeIdStatus(6001, 'disabled');

        const results = searchEmployeeIds('60', 'disabled');

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe(6001);
      });

      it('should return empty array when no matches', async () => {
        const { importEmployeeIds, searchEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([6001, 6002]);

        const results = searchEmployeeIds('99');

        expect(results).toHaveLength(0);
      });
    });

    describe('batchUpdateEmployeeIds', () => {
      it('should enable multiple IDs', async () => {
        const { importEmployeeIds, updateEmployeeIdStatus, batchUpdateEmployeeIds, getAllEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([7001, 7002, 7003]);
        updateEmployeeIdStatus(7001, 'disabled');
        updateEmployeeIdStatus(7002, 'disabled');

        const result = batchUpdateEmployeeIds([7001, 7002], 'enable');

        expect(result.success).toBe(2);
        expect(result.failed).toBe(0);

        const allIds = getAllEmployeeIds();
        const ids7001 = allIds.find(id => id.id === 7001);
        const ids7002 = allIds.find(id => id.id === 7002);
        expect(ids7001?.status).toBe('available');
        expect(ids7002?.status).toBe('available');
      });

      it('should disable multiple IDs', async () => {
        const { importEmployeeIds, batchUpdateEmployeeIds, getAllEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([7101, 7102, 7103]);

        const result = batchUpdateEmployeeIds([7101, 7102], 'disable');

        expect(result.success).toBe(2);

        const allIds = getAllEmployeeIds();
        const ids7101 = allIds.find(id => id.id === 7101);
        const ids7102 = allIds.find(id => id.id === 7102);
        expect(ids7101?.status).toBe('disabled');
        expect(ids7102?.status).toBe('disabled');
      });

      it('should delete multiple IDs', async () => {
        const { importEmployeeIds, batchUpdateEmployeeIds, getAllEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([7201, 7202, 7203]);

        const result = batchUpdateEmployeeIds([7201, 7202], 'delete');

        expect(result.success).toBe(2);

        const allIds = getAllEmployeeIds();
        expect(allIds.find(id => id.id === 7201)).toBeUndefined();
        expect(allIds.find(id => id.id === 7202)).toBeUndefined();
        expect(allIds.find(id => id.id === 7203)).toBeDefined();
      });
    });
  });

  describe('ID Allocation', () => {
    describe('allocateId', () => {
      it('should allocate an ID to an IP address', async () => {
        const { importEmployeeIds, allocateId, getAllEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([8001, 8002]);

        const result = allocateId('192.168.1.100');

        expect([8001, 8002]).toContain(result.id);
        expect(result.ipAddress).toBe('192.168.1.100');
        expect(result.uniqueId).toBeDefined();

        const allIds = getAllEmployeeIds();
        const allocated = allIds.find(id => id.id === result.id);
        expect(allocated?.status).toBe('allocated');
      });

      it('should return existing allocation for same IP', async () => {
        const { importEmployeeIds, allocateId } = await getServiceFunctions();
        importEmployeeIds([8003]);
        const first = allocateId('192.168.1.101');
        const second = allocateId('192.168.1.101');

        expect(second.id).toBe(first.id);
        expect(second.uniqueId).toBe('existing');
      });

      it('should force new allocation when requested', async () => {
        const { importEmployeeIds, allocateId } = await getServiceFunctions();
        importEmployeeIds([8004, 8005]);
        const first = allocateId('192.168.1.102');
        const second = allocateId('192.168.1.102', true);

        expect(second.id).not.toBe(first.id);
        expect(second.uniqueId).not.toBe('existing');
      });

      it('should throw error when no IDs available', async () => {
        const { allocateId } = await getServiceFunctions();
        // Don't import any IDs

        expect(() => allocateId('192.168.1.103')).toThrow('No available ID found in the pool');
      });
    });

    describe('releaseId', () => {
      it('should release an allocated ID', async () => {
        const { importEmployeeIds, allocateId, releaseId, getAllEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([9001]);
        const allocation = allocateId('192.168.1.104');

        releaseId(allocation.id);

        const allIds = getAllEmployeeIds();
        const idInfo = allIds.find(id => id.id === 9001);
        expect(idInfo?.status).toBe('available');
      });

      it('should throw error when releasing non-allocated ID', async () => {
        const { releaseId } = await getServiceFunctions();
        expect(() => releaseId(9999)).toThrow('ID is not allocated or already released');
      });
    });

    describe('cleanupExpiredIds', () => {
      it('should clean up expired allocations', async () => {
        const { importEmployeeIds, allocateId, cleanupExpiredIds, getAllEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([9101, 9102]);

        // Manually insert expired allocation using direct db access
        const dbModule = await import('../app/db.ts');
        const db = dbModule.default();
        const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
        db.prepare(
          'INSERT INTO allocated_ids (id, uniqueSessionId, allocationTime, ipAddress, expiresAt) VALUES (?, ?, ?, ?, ?)'
        ).run(9101, 'expired-session', pastDate, '192.168.1.105', pastDate);

        db.prepare(
          'UPDATE employee_pool SET status = ? WHERE id = ?'
        ).run('allocated', 9101);

        // Valid allocation
        allocateId('192.168.1.106');

        // Run cleanup
        cleanupExpiredIds();

        // Check that expired ID is cleaned up
        const allIds = getAllEmployeeIds();
        const expired = allIds.find(id => id.id === 9101);
        expect(expired?.status).toBe('available');

        // Check that valid allocation still exists
        const valid = allIds.find(id => id.id === 9102);
        expect(valid?.status).toBe('allocated');
      });
    });

    describe('clearAllIds', () => {
      it('should clear all allocated IDs', async () => {
        const { importEmployeeIds, allocateId, clearAllIds, getAllEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([9201, 9202, 9203]);
        allocateId('192.168.1.107');
        allocateId('192.168.1.108');

        clearAllIds();

        const allIds = getAllEmployeeIds();
        const allocated = allIds.filter(id => id.status === 'allocated');
        expect(allocated).toHaveLength(0);
        expect(allIds.every(id => id.status === 'available')).toBe(true);
      });
    });

    describe('getPoolStats', () => {
      it('should return correct pool statistics', async () => {
        const { importEmployeeIds, updateEmployeeIdStatus, allocateId, getPoolStats } = await getServiceFunctions();
        importEmployeeIds([9301, 9302, 9303, 9304]);
        updateEmployeeIdStatus(9304, 'disabled');
        allocateId('192.168.1.109');

        const stats = getPoolStats();

        expect(stats.total).toBe(4);
        expect(stats.available).toBe(2); // 9301, 9302
        expect(stats.disabled).toBe(1); // 9304
        expect(stats.allocated).toBe(1); // 9303
      });

      it('should return zeros for empty pool', async () => {
        const { getPoolStats } = await getServiceFunctions();
        const stats = getPoolStats();

        expect(stats.total).toBe(0);
        expect(stats.available).toBe(0);
        expect(stats.disabled).toBe(0);
        expect(stats.allocated).toBe(0);
      });
    });
  });

  describe('Admin Management', () => {
    describe('verifyAdminPassword', () => {
      it('should verify correct password', async () => {
        const { verifyAdminPassword } = await getServiceFunctions();
        expect(verifyAdminPassword('root123')).toBe(true);
      });

      it('should reject incorrect password', async () => {
        const { verifyAdminPassword } = await getServiceFunctions();
        expect(verifyAdminPassword('wrong')).toBe(false);
      });
    });

    describe('changeAdminPassword', () => {
      it('should change password with correct old password', async () => {
        const { changeAdminPassword, verifyAdminPassword } = await getServiceFunctions();
        const result = changeAdminPassword('root123', 'newpass123');

        expect(result).toBe(true);
        expect(verifyAdminPassword('newpass123')).toBe(true);
      });

      it('should fail with incorrect old password', async () => {
        const { changeAdminPassword, verifyAdminPassword } = await getServiceFunctions();
        const result = changeAdminPassword('wrong', 'newpass123');

        expect(result).toBe(false);
        expect(verifyAdminPassword('newpass123')).toBe(false);
      });
    });

    describe('createAdminSession', () => {
      it('should create a valid admin session', async () => {
        const { createAdminSession, verifyAdminSession } = await getServiceFunctions();
        const sessionId = createAdminSession();

        expect(sessionId).toBeDefined();
        expect(typeof sessionId).toBe('string');
        expect(sessionId.length).toBeGreaterThan(0);

        const isValid = verifyAdminSession(sessionId);
        expect(isValid).toBe(true);
      });
    });

    describe('verifyAdminSession', () => {
      it('should verify valid session', async () => {
        const { createAdminSession, verifyAdminSession } = await getServiceFunctions();
        const sessionId = createAdminSession();
        expect(verifyAdminSession(sessionId)).toBe(true);
      });

      it('should reject invalid session', async () => {
        const { verifyAdminSession } = await getServiceFunctions();
        expect(verifyAdminSession('invalid-session-id')).toBe(false);
      });
    });

    describe('deleteAdminSession', () => {
      it('should delete admin session', async () => {
        const { createAdminSession, deleteAdminSession, verifyAdminSession } = await getServiceFunctions();
        const sessionId = createAdminSession();
        deleteAdminSession(sessionId);

        expect(verifyAdminSession(sessionId)).toBe(false);
      });
    });
  });

  describe('Motivational Quotes', () => {
    describe('importQuotes', () => {
      it('should import quotes from text', async () => {
        const { importQuotes, getAllQuotes } = await getServiceFunctions();
        const text = '天道酬勤|老子\n厚德载物|佚名\n成功源于坚持|爱迪生';

        const result = importQuotes(text);

        expect(result.success).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.errors).toHaveLength(0);

        const quotes = getAllQuotes();
        expect(quotes).toHaveLength(3);
      });

      it('should handle empty lines', async () => {
        const { importQuotes } = await getServiceFunctions();
        const text = '第一句|作者\n\n第二句|作者';

        const result = importQuotes(text);

        expect(result.success).toBe(2);
        expect(result.failed).toBe(0);
      });

      it('should skip duplicate quotes', async () => {
        const { importQuotes } = await getServiceFunctions();
        importQuotes('测试|作者');

        const result = importQuotes('测试|作者');

        expect(result.success).toBe(0);
        expect(result.failed).toBe(1);
        expect(result.errors).toContain('第1行: 名言已存在');
      });

      it('should handle missing source', async () => {
        const { importQuotes, getAllQuotes } = await getServiceFunctions();
        const result = importQuotes('只有名言内容');

        expect(result.success).toBe(1);
        expect(result.errors).toHaveLength(0);

        const quotes = getAllQuotes();
        expect(quotes[0].source).toBe('佚名');
      });
    });

    describe('getRandomQuote', () => {
      it('should return a random quote', async () => {
        const { importQuotes, getRandomQuote } = await getServiceFunctions();
        importQuotes('名言1|作者1\n名言2|作者2');

        const quote = getRandomQuote();

        expect(quote).toBeDefined();
        expect(['名言1', '名言2']).toContain(quote!.quote);
      });

      it('should return null when no quotes exist', async () => {
        const { getRandomQuote } = await getServiceFunctions();
        const quote = getRandomQuote();

        expect(quote).toBeNull();
      });
    });

    describe('getAllQuotes', () => {
      it('should return all quotes', async () => {
        const { importQuotes, getAllQuotes } = await getServiceFunctions();
        importQuotes('Q1|S1\nQ2|S2');

        const quotes = getAllQuotes();

        expect(quotes).toHaveLength(2);
      });
    });

    describe('deleteQuote', () => {
      it('should delete a quote', async () => {
        const { importQuotes, getAllQuotes, deleteQuote } = await getServiceFunctions();
        importQuotes('待删除|作者');
        const quotes = getAllQuotes();
        const quoteId = quotes[0].id;

        const result = deleteQuote(quoteId);

        expect(result.success).toBe(true);
        expect(getAllQuotes()).toHaveLength(0);
      });

      it('should fail for non-existent quote', async () => {
        const { deleteQuote } = await getServiceFunctions();
        const result = deleteQuote(9999);

        expect(result.success).toBe(false);
        expect(result.error).toContain('不存在');
      });
    });
  });

  describe('System Configuration', () => {
    describe('getQuoteInterval', () => {
      it('should return default interval', async () => {
        const { getQuoteInterval } = await getServiceFunctions();
        const interval = getQuoteInterval();

        expect(interval).toBe(86400000); // 24 hours
      });

      it('should return custom interval if set', async () => {
        const { setQuoteInterval, getQuoteInterval } = await getServiceFunctions();
        setQuoteInterval(3600000); // 1 hour
        const interval = getQuoteInterval();

        expect(interval).toBe(3600000);
      });
    });

    describe('setQuoteInterval', () => {
      it('should set valid interval', async () => {
        const { setQuoteInterval, getQuoteInterval } = await getServiceFunctions();
        const result = setQuoteInterval(7200000);

        expect(result.success).toBe(true);
        expect(getQuoteInterval()).toBe(7200000);
      });

      it('should reject negative interval', async () => {
        const { setQuoteInterval } = await getServiceFunctions();
        const result = setQuoteInterval(-1000);

        expect(result.success).toBe(false);
        expect(result.error).toContain('非负数字');
      });

      it('should reject NaN', async () => {
        const { setQuoteInterval } = await getServiceFunctions();
        const result = setQuoteInterval(NaN);

        expect(result.success).toBe(false);
      });
    });
  });
});

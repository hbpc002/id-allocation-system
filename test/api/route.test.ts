import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import db reset function
import { resetDb } from '../../app/db.ts';

const TEST_DB_DIR = path.join(__dirname, '../../data/test');

// Helper to fully reset database state
async function resetDatabase() {
  // Close existing connection and reset singleton
  resetDb();

  // Delete test database files
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
  }

  // Set environment
  process.env.DATA_DIR = TEST_DB_DIR;
}

// Helper to create a mock request
function createMockRequest(options: {
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  url?: string;
}): Request {
  const headers = new Headers(options.headers || {});

  if (options.body && options.method === 'POST') {
    // For JSON body
    if (options.headers?.['Content-Type']?.includes('application/json')) {
      return new Request(options.url || 'http://localhost/api/id-allocation', {
        method: options.method,
        headers,
        body: JSON.stringify(options.body),
      });
    }
    // For text body
    if (options.headers?.['Content-Type']?.includes('text/plain')) {
      return new Request(options.url || 'http://localhost/api/id-allocation', {
        method: options.method,
        headers,
        body: options.body,
      });
    }
  }

  return new Request(options.url || 'http://localhost/api/id-allocation', {
    method: options.method,
    headers,
  });
}

// Helper to dynamically import service functions (to get fresh db)
async function getServiceFunctions() {
  const module = await import('../../app/id-allocation-service.ts');
  return module;
}

// Helper to dynamically import route (to get fresh service references)
async function getRouteModule() {
  const module = await import('../../app/api/id-allocation/route.ts');
  return module;
}

// Helper to get admin session
async function getAdminSession(): Promise<string> {
  const { POST } = await getRouteModule();
  const request = createMockRequest({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'adminLogin', password: 'root123' }
  });
  const response = await POST(request);
  const data = await response.json();
  return data.sessionId;
}

describe('API Route - /api/id-allocation', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
    delete process.env.DATA_DIR;
  });

  describe('GET /api/id-allocation', () => {
    it('should return pool stats and allocated IDs', async () => {
      // Setup: import some IDs and allocate one
      const { importEmployeeIds, allocateId } = await getServiceFunctions();
      importEmployeeIds([1001, 1002, 1003]);
      const allocation = allocateId('192.168.1.100');

      const { GET } = await getRouteModule();
      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalPoolIds).toBe(3);
      expect(data.availableIds).toBe(2);
      expect(data.allocatedIdsCount).toBe(1);
      expect(data.allocatedIds).toHaveLength(1);
      expect(data.allocatedIds[0].id).toBe(allocation.id);
      expect(data.allocatedIds[0].ipAddress).toBe('192.168.1.100');
    });

    it('should detect client allocated ID from IP', async () => {
      const { importEmployeeIds, allocateId } = await getServiceFunctions();
      importEmployeeIds([2001, 2002]);
      const allocation = allocateId('192.168.1.200');

      const { GET } = await getRouteModule();
      const request = createMockRequest({
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.200' }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.clientAllocatedId).toBe(allocation.id);
    });

    it('should handle empty pool', async () => {
      const { GET } = await getRouteModule();
      const request = createMockRequest({ method: 'GET' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalPoolIds).toBe(0);
      expect(data.availableIds).toBe(0);
      expect(data.allocatedIdsCount).toBe(0);
      expect(data.allocatedIds).toHaveLength(0);
    });
  });

  describe('POST /api/id-allocation - Public Actions', () => {
    describe('allocate action', () => {
      it('should allocate an ID', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([3001]);

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { action: 'allocate' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.id).toBe(3001);
        expect(data.uniqueId).toBeDefined();
        expect(data.ipAddress).toBeDefined();
      });

      it('should allocate with forceNewAllocation flag', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([3002, 3003]);

        const { POST } = await getRouteModule();
        const request1 = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
          body: { action: 'allocate' }
        });

        const response1 = await POST(request1);
        const data1 = await response1.json();
        const firstId = data1.id;

        const request2 = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
          body: { action: 'allocate', forceNewAllocation: true }
        });

        const response2 = await POST(request2);
        const data2 = await response2.json();

        expect(data2.success).toBe(true);
        expect(data2.id).not.toBe(firstId); // Different ID
        expect([3002, 3003]).toContain(data2.id); // Should be one of the remaining IDs
      });
    });

    describe('release action', () => {
      it('should release an allocated ID', async () => {
        const { importEmployeeIds, allocateId } = await getServiceFunctions();
        importEmployeeIds([4001]);
        const allocation = allocateId('192.168.1.100');

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { action: 'release', id: allocation.id }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('getRandomQuote action', () => {
      it('should return a random quote', async () => {
        const { importQuotes } = await getServiceFunctions();
        importQuotes('测试名言|测试作者');

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { action: 'getRandomQuote' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.quote).toBe('测试名言');
        expect(data.data.source).toBe('测试作者');
      });
    });

    describe('getQuoteInterval action', () => {
      it('should return quote interval', async () => {
        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { action: 'getQuoteInterval' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBe(86400000);
      });
    });
  });

  describe('POST /api/id-allocation - Admin Actions', () => {
    describe('adminLogin action', () => {
      it('should login with correct password', async () => {
        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { action: 'adminLogin', password: 'root123' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.sessionId).toBeDefined();
      });

      it('should reject wrong password', async () => {
        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { action: 'adminLogin', password: 'wrong' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
      });
    });

    describe('verifySession action', () => {
      it('should verify valid session', async () => {
        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'verifySession' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.success).toBe(true);
      });

      it('should reject invalid session', async () => {
        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': 'invalid'
          },
          body: { action: 'verifySession' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.success).toBe(false);
      });
    });

    describe('clearAll action', () => {
      it('should clear all with admin auth', async () => {
        const { importEmployeeIds, allocateId } = await getServiceFunctions();
        importEmployeeIds([5001, 5002]);
        allocateId('192.168.1.100');
        allocateId('192.168.1.101');

        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'clearAll' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify all cleared
        const getDb = (await import('../../app/db.ts')).default;
        const db = getDb();
        const count = db.prepare('SELECT COUNT(*) as count FROM allocated_ids').get();
        expect(count.count).toBe(0);
      });

      it('should reject without admin auth', async () => {
        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { action: 'clearAll' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
      });
    });

    describe('getAllIds action', () => {
      it('should return all IDs with admin auth', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([6001, 6002]);

        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'getAllIds' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(2);
      });
    });

    describe('addId action', () => {
      it('should add ID with admin auth', async () => {
        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'addId', id: 7001 }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify added
        const getDb = (await import('../../app/db.ts')).default;
        const db = getDb();
        const row = db.prepare('SELECT * FROM employee_pool WHERE id = ?').get(7001);
        expect(row).toBeDefined();
      });
    });

    describe('deleteId action', () => {
      it('should delete ID with admin auth', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([7101]);

        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'deleteId', id: 7101 }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('updateIdStatus action', () => {
      it('should update ID status with admin auth', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([7201]);

        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'updateIdStatus', id: 7201, status: 'disabled' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify status updated
        const getDb = (await import('../../app/db.ts')).default;
        const db = getDb();
        const row = db.prepare('SELECT status FROM employee_pool WHERE id = ?').get(7201);
        expect(row.status).toBe('disabled');
      });
    });

    describe('batchUpdate action', () => {
      it('should batch update IDs with admin auth', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([7301, 7302, 7303]);

        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'batchUpdate', ids: [7301, 7302], operation: 'disable' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.success).toBe(2);
      });
    });

    describe('searchIds action', () => {
      it('should search IDs with admin auth', async () => {
        const { importEmployeeIds } = await getServiceFunctions();
        importEmployeeIds([7401, 7402, 7500]);

        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'searchIds', query: '74' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(2);
      });
    });

    describe('changePassword action', () => {
      it('should change password with admin auth', async () => {
        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'changePassword', oldPassword: 'root123', newPassword: 'newpass' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should reject wrong old password', async () => {
        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'changePassword', oldPassword: 'wrong', newPassword: 'newpass' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });
    });

    describe('logout action', () => {
      it('should logout and delete session', async () => {
        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'logout' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify session deleted
        const { verifyAdminSession } = await getServiceFunctions();
        expect(verifyAdminSession(sessionId)).toBe(false);
      });
    });

    describe('importQuotes action', () => {
      it('should import quotes with admin auth', async () => {
        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'importQuotes', text: '名言|作者' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.uploadedCount).toBe(1);
      });
    });

    describe('getAllQuotes action', () => {
      it('should return all quotes with admin auth', async () => {
        const { importQuotes } = await getServiceFunctions();
        importQuotes('测试|作者');

        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'getAllQuotes' }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
      });
    });

    describe('deleteQuote action', () => {
      it('should delete quote with admin auth', async () => {
        const { importQuotes, getAllQuotes } = await getServiceFunctions();
        importQuotes('待删除|作者');
        const quotes = getAllQuotes();
        const quoteId = quotes[0].id;

        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'deleteQuote', id: quoteId }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('setQuoteInterval action', () => {
      it('should set quote interval with admin auth', async () => {
        const sessionId = await getAdminSession();

        const { POST } = await getRouteModule();
        const request = createMockRequest({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': sessionId
          },
          body: { action: 'setQuoteInterval', interval: 3600000 }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('POST /api/id-allocation - File Upload', () => {
    it('should handle text/plain file upload for employee IDs', async () => {
      const fileContent = '8001\n8002\n8003';

      const { POST } = await getRouteModule();
      const request = createMockRequest({
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'x-admin-session': 'dummy'
        },
        body: fileContent
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.uploadedCount).toBe(3);
      expect(data.failedCount).toBe(0);
    });

    it('should handle invalid IDs in file upload', async () => {
      const fileContent = '8001\ninvalid\n8002';

      const { POST } = await getRouteModule();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: fileContent
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.uploadedCount).toBe(2);
      expect(data.failedCount).toBe(0); // Invalid lines are just skipped
    });

    it('should handle empty file upload', async () => {
      const { POST } = await getRouteModule();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: ''
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/id-allocation - Invalid Actions', () => {
    it('should return error for invalid action', async () => {
      const { POST } = await getRouteModule();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { action: 'invalidAction' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid action');
    });

    it('should return error for missing action', async () => {
      const { POST } = await getRouteModule();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {}
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('getFadeOutDelay action', () => {
    it('should return current fade out delay', async () => {
      const { POST } = await getRouteModule();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { action: 'getFadeOutDelay' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(typeof data.data).toBe('number');
      expect(data.data).toBeGreaterThanOrEqual(1000);
      expect(data.data).toBeLessThanOrEqual(60000);
    });
  });

  describe('setFadeOutDelay action', () => {
    it('should set fade out delay with admin auth', async () => {
      const { POST } = await getRouteModule();
      const request = createMockRequest({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': 'dummy'
        },
        body: { action: 'setFadeOutDelay', delay: 10000 }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject setFadeOutDelay without admin auth', async () => {
      const { POST } = await getRouteModule();
      const request = createMockRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { action: 'setFadeOutDelay', delay: 10000 }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Admin authentication required');
    });
  });
});

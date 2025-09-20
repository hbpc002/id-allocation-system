import db from './db';

// Removed hard-coded ID range and total count

// Function to get currently allocated IDs from the database
const getCurrentlyAllocatedIds = () => {
  const rows = db.prepare('SELECT id FROM allocated_ids').all() as { id: number }[];
  return new Set(rows.map(row => row.id));
};

const allocateId = (ipAddress: string, forceNewAllocation: boolean = false) => {
  console.log(`ID allocation requested for IP: ${ipAddress}, forceNewAllocation: ${forceNewAllocation}`);
  
  // Check if this IP already has an allocated ID
  const existingAllocation = db.prepare('SELECT id FROM allocated_ids WHERE ipAddress = ?').get(ipAddress) as { id: number } | undefined;
  
  if (existingAllocation && !forceNewAllocation) {
    console.log(`IP ${ipAddress} already has allocated ID ${existingAllocation.id}. Returning existing allocation.`);
    return { id: existingAllocation.id, uniqueId: 'existing', ipAddress: ipAddress };
  }
  
  const currentlyAllocated = getCurrentlyAllocatedIds();
  // Get an available ID from the employee_pool that is not currently allocated
  const availableIdRow = db.prepare(`
    SELECT id FROM employee_pool
    WHERE id NOT IN (SELECT id FROM allocated_ids)
    LIMIT 1
  `).get() as { id: number } | undefined;

  if (!availableIdRow) {
    console.log('No available ID found in the pool');
    throw new Error('No available ID found in the pool');
  }

  const availableId = availableIdRow.id;
  console.log(`Available ID found: ${availableId}`);

  if (availableId === undefined) {
    console.log('No available ID found (should not happen if size check passed)');
    throw new Error('No available ID found (should not happen if size check passed)');
  }

  const uniqueSessionId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
  const allocationTime = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setHours(23, 59, 59, 999); // Set to end of current day
  const expiresAtISO = expiresAt.toISOString();

  console.log(`Allocating ID: ${availableId}, IP: ${ipAddress}`);
  db.prepare(
    'INSERT INTO allocated_ids (id, uniqueSessionId, allocationTime, ipAddress, expiresAt) VALUES (?, ?, ?, ?, ?)'
  ).run(availableId, uniqueSessionId, allocationTime, ipAddress, expiresAtISO);

  console.log(`ID allocated successfully: ${availableId}`);
  return { id: availableId, uniqueId: uniqueSessionId, ipAddress: ipAddress };
};

const releaseId = (id: number) => {
  const info = db.prepare('DELETE FROM allocated_ids WHERE id = ?').run(id);
  if (info.changes === 0) {
    throw new Error('ID is not allocated or already released');
  }
};

const cleanupExpiredIds = () => {
  const now = new Date().toISOString();
  db.prepare('DELETE FROM allocated_ids WHERE expiresAt <= ?').run(now);
};

// Initial cleanup on service start
cleanupExpiredIds();
const clearAllIds = () => {
  db.prepare('DELETE FROM allocated_ids').run();
};

export { allocateId, releaseId, cleanupExpiredIds, getCurrentlyAllocatedIds, clearAllIds };

import db from './db';

const ID_RANGE_START = 644100;
const ID_RANGE_END = 644400;
const TOTAL_IDS = ID_RANGE_END - ID_RANGE_START + 1;

// Function to get currently allocated IDs from the database
const getCurrentlyAllocatedIds = () => {
  const rows = db.prepare('SELECT id FROM allocated_ids').all() as { id: number }[];
  return new Set(rows.map(row => row.id));
};

const allocateId = (ipAddress: string) => {
  console.log(`ID allocation requested for IP: ${ipAddress}`);
  const currentlyAllocated = getCurrentlyAllocatedIds();
  if (currentlyAllocated.size >= TOTAL_IDS) {
    console.log('All IDs are in use');
    throw new Error('All IDs are in use');
  }

  let availableId: number | undefined;
  for (let i = 0; i < TOTAL_IDS; i++) {
    const potentialId = ID_RANGE_START + i;
    if (!currentlyAllocated.has(potentialId)) {
      availableId = potentialId;
      console.log(`Available ID found: ${availableId}`);
      break;
    }
  }

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

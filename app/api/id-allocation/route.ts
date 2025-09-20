import { NextResponse, NextRequest } from 'next/server';
import { allocateId, releaseId, cleanupExpiredIds, getCurrentlyAllocatedIds, clearAllIds } from '../../id-allocation-service';
import db from '../../db';

export async function GET(request: Request) {
  cleanupExpiredIds(); // Clean up expired IDs on every GET request to ensure fresh data
  const currentlyAllocated = getCurrentlyAllocatedIds();
  const allocatedIdsWithIPs = Array.from(currentlyAllocated).map((id: number) => {
    const row = db.prepare('SELECT id, ipAddress FROM allocated_ids WHERE id = ?').get(id) as { id: number, ipAddress: string };
    return { id: row.id, ipAddress: row.ipAddress };
  });
  return NextResponse.json({ allocatedIds: allocatedIdsWithIPs });
}

export async function POST(request: Request) {
  const { action, id } = await request.json();
  const ipAddress = (request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || request.headers.get('fastly-client-ip') || request.headers.get('true-client-ip') || request.headers.get('x-real-ip')) || 'unknown';
  console.log('Extracted ipAddress from headers:', ipAddress);
  // console.log('Received ipAddress:', ipAddress);
  console.log('Received action:', action);

  try {
    if (action === 'allocate') {
      const result = allocateId(ipAddress);
      // console.log('Allocated ID with ipAddress:', result.id, result.ipAddress);
      // console.log('Allocated ID with ipAddress:', result.id, result.ipAddress);
      // console.log('Allocated ID:', result.id);
      return NextResponse.json({ success: true, id: result.id, uniqueId: result.uniqueId });
    } else if (action === 'release') {
      releaseId(id);
      console.log('Released ID:', id);
      return NextResponse.json({ success: true });
    } else if (action === 'clearAll') {
      clearAllIds();
      console.log('All IDs cleared');
      return NextResponse.json({ success: true });
    } else if (action === 'uploadPool') {
      const text = await request.text();
      const lines = text.split('\n');
      const uploadedIds = new Set<number>();

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          const id = parseInt(trimmed);
          if (!isNaN(id) && id >= 644100 && id <= 644400) {
            uploadedIds.add(id);
          }
        }
      }

      if (uploadedIds.size === 0) {
        return NextResponse.json({ success: false, error: 'No valid IDs found in the file' }, { status: 400 });
      }

      db.transaction(() => {
        uploadedIds.forEach(id => {
          db.prepare('INSERT OR IGNORE INTO employee_pool (id) VALUES (?)').run(id);
        });
      });

      return NextResponse.json({
        success: true,
        uploadedCount: uploadedIds.size
      });
    } else {
      console.log('Invalid action:', action);
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
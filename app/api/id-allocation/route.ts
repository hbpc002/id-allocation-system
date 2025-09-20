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
  const totalPoolIds = (db.prepare('SELECT COUNT(*) as count FROM employee_pool').get() as { count: number }).count;
  return NextResponse.json({ allocatedIds: allocatedIdsWithIPs, totalPoolIds });
}

export async function POST(request: Request) {
  // For uploadPool, we don't use JSON, so handle it separately
  const contentType = request.headers.get('content-type');
  if (contentType && contentType.includes('text/plain')) {
    // This is likely an uploadPool request
    const text = await request.text();
    const lines = text.split('\n');
    const uploadedIds = new Set<number>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        const id = parseInt(trimmed);
        if (!isNaN(id)) {
          uploadedIds.add(id);
        }
      }
    }

    if (uploadedIds.size === 0) {
      return NextResponse.json({ success: false, error: 'No valid IDs found in the file' }, { status: 400 });
    }

    console.log('Starting database transaction for uploadPool');
    try {
      db.transaction(() => {
        console.log(`Inserting ${uploadedIds.size} IDs into employee_pool`);
        uploadedIds.forEach(id => {
          db.prepare('INSERT OR IGNORE INTO employee_pool (id) VALUES (?)').run(id);
        });
        console.log('Database transaction completed successfully');
      })();
    } catch (dbError) {
      console.error('Database transaction failed:', dbError);
      return NextResponse.json({ success: false, error: 'Database error during upload' }, { status: 500 });
    }
    console.log('Proceeding to fetch updated total pool count');

    // Log the current state of the employee_pool for debugging
    const poolRows = db.prepare('SELECT id FROM employee_pool').all() as { id: number }[];
    console.log('Current employee_pool after upload:', poolRows);

    let updatedTotalPoolIds: number;
    try {
      // Get updated total pool count
      updatedTotalPoolIds = (db.prepare('SELECT COUNT(*) as count FROM employee_pool').get() as { count: number }).count;
    } catch (countError) {
      console.error('Failed to get updated total pool count:', countError);
      return NextResponse.json({ success: false, error: 'Failed to get total count after upload' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedIds.size,
      totalPoolIds: updatedTotalPoolIds
    });
  }

  // For other actions, parse JSON
  const { action, id } = await request.json();
  const ipAddress = (request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || request.headers.get('fastly-client-ip') || request.headers.get('true-client-ip') || request.headers.get('x-real-ip')) || 'unknown';
  console.log('Extracted ipAddress from headers:', ipAddress);
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
          if (!isNaN(id)) {
            uploadedIds.add(id);
          }
        }
      }

      if (uploadedIds.size === 0) {
        return NextResponse.json({ success: false, error: 'No valid IDs found in the file' }, { status: 400 });
      }

      console.log('Starting database transaction for uploadPool');
      try {
        db.transaction(() => {
          console.log(`Inserting ${uploadedIds.size} IDs into employee_pool`);
          uploadedIds.forEach(id => {
            db.prepare('INSERT OR IGNORE INTO employee_pool (id) VALUES (?)').run(id);
          });
          console.log('Database transaction completed successfully');
        })();
      } catch (dbError) {
        console.error('Database transaction failed:', dbError);
        return NextResponse.json({ success: false, error: 'Database error during upload' }, { status: 500 });
      }
      console.log('Proceeding to fetch updated total pool count');
      // No closing brace here - this was a mistake

      // Log the current state of the employee_pool for debugging
      const poolRows = db.prepare('SELECT id FROM employee_pool').all() as { id: number }[];
      console.log('Current employee_pool after upload:', poolRows);

      let updatedTotalPoolIds: number;
      try {
        // Get updated total pool count
        updatedTotalPoolIds = (db.prepare('SELECT COUNT(*) as count FROM employee_pool').get() as { count: number }).count;
      } catch (countError) {
        console.error('Failed to get updated total pool count:', countError);
        return NextResponse.json({ success: false, error: 'Failed to get total count after upload' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        uploadedCount: uploadedIds.size,
        totalPoolIds: updatedTotalPoolIds
      });
    } else {
      console.log('Invalid action:', action);
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
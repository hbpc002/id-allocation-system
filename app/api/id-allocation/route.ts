import { NextResponse } from 'next/server';
import {
  allocateId,
  releaseId,
  cleanupExpiredIds,
  clearAllIds,
  getPoolStats,
  getAllEmployeeIds,
  importEmployeeIds,
  addEmployeeId,
  deleteEmployeeId,
  updateEmployeeIdStatus,
  batchUpdateEmployeeIds,
  searchEmployeeIds,
  verifyAdminSession,
  verifyAdminPassword,
  createAdminSession,
  deleteAdminSession,
  changeAdminPassword
} from '../../id-allocation-service';
import getDb from '../../db';

// Helper function to extract client IP
function getClientIp(request: Request): string {
  let clientIp = request.headers.get('x-forwarded-for') ||
                 request.headers.get('cf-connecting-ip') ||
                 request.headers.get('fastly-client-ip') ||
                 request.headers.get('true-client-ip') ||
                 request.headers.get('x-real-ip') ||
                 'unknown';

  if (typeof clientIp === 'string' && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  if (clientIp === '127.0.0.1' || clientIp === '::1') {
    const nextRequest = request as unknown as { socket?: { remoteAddress?: string } };
    if (nextRequest.socket && nextRequest.socket.remoteAddress) {
      clientIp = nextRequest.socket.remoteAddress;
    }
  }

  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'unknown') {
    const serverIp = process.env.NEXT_PUBLIC_SERVER_IP || 'unknown';
    clientIp = serverIp !== 'unknown' ? serverIp : 'unknown';
  }

  return clientIp;
}

// Helper function to verify admin session from header
async function verifyAdminAuth(request: Request): Promise<boolean> {
  const sessionId = request.headers.get('x-admin-session');
  if (!sessionId) return false;
  return verifyAdminSession(sessionId);
}

export async function GET(request: Request) {
  try {
    cleanupExpiredIds(); // Clean up expired IDs on every GET request to ensure fresh data

    const clientIp = getClientIp(request);

    // Get currently allocated IDs for the client IP
    const clientAllocatedIdRow = getDb().prepare('SELECT id FROM allocated_ids WHERE ipAddress = ?').get(clientIp) as { id: number } | undefined;
    const clientAllocatedId = clientAllocatedIdRow ? clientAllocatedIdRow.id : null;

    // Get all allocated IDs with their IP addresses directly from the database
    const allocatedRows = getDb().prepare('SELECT id, ipAddress FROM allocated_ids').all() as { id: number, ipAddress: string }[];
    const allocatedIdsWithIPs = allocatedRows.map(row => ({
      id: row.id,
      ipAddress: row.ipAddress
    }));

    // Get pool statistics
    const poolStats = getPoolStats();

    return NextResponse.json({
      allocatedIds: allocatedIdsWithIPs,
      totalPoolIds: poolStats.total,
      availableIds: poolStats.available,
      disabledIds: poolStats.disabled,
      allocatedIdsCount: poolStats.allocated,
      clientAllocatedId
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('Handling POST request');
  const contentType = request.headers.get('content-type');

  // Handle text/plain for file uploads
  if (contentType && contentType.includes('text/plain')) {
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

    try {
      const result = importEmployeeIds(Array.from(uploadedIds));
      return NextResponse.json({
        success: true,
        uploadedCount: result.success,
        failedCount: result.failed,
        totalPoolIds: getPoolStats().total,
        errors: result.errors
      });
    } catch (error) {
      console.error('Upload failed:', error);
      return NextResponse.json({ success: false, error: 'Database error during upload' }, { status: 500 });
    }
  }

  // Parse JSON for other actions - only once!
  const body = await request.json();
  const { action, id, forceNewAllocation, ids, oldPassword, newPassword, query, status, password, operation } = body;
  const ipAddress = getClientIp(request);

  console.log('Received action:', action);

  try {
    // Public actions (no authentication required)
    switch (action) {
      case 'allocate': {
        const result = allocateId(ipAddress, forceNewAllocation);
        return NextResponse.json({ success: true, id: result.id, uniqueId: result.uniqueId, ipAddress });
      }

      case 'release': {
        releaseId(id);
        return NextResponse.json({ success: true });
      }

      case 'clearAll': {
        // Check admin authentication for clearAll
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
        }
        clearAllIds();
        return NextResponse.json({ success: true });
      }

      // Admin-only actions
      case 'adminLogin': {
        if (verifyAdminPassword(password)) {
          const sessionId = createAdminSession();
          return NextResponse.json({ success: true, sessionId });
        }
        return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
      }

      case 'changePassword': {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
        }
        const success = changeAdminPassword(oldPassword, newPassword);
        if (success) {
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: 'Old password is incorrect' }, { status: 400 });
      }

      case 'verifySession': {
        const isAdmin = await verifyAdminAuth(request);
        return NextResponse.json({ success: isAdmin });
      }

      case 'logout': {
        const sessionId = request.headers.get('x-admin-session');
        if (sessionId) {
          deleteAdminSession(sessionId);
        }
        return NextResponse.json({ success: true });
      }

      case 'getAllIds': {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
        }
        const allIds = getAllEmployeeIds();
        return NextResponse.json({ success: true, data: allIds });
      }

      case 'getPoolStats': {
        const stats = getPoolStats();
        return NextResponse.json({ success: true, data: stats });
      }

      case 'addId': {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
        }
        const result = addEmployeeId(id);
        if (result.success) {
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      case 'deleteId': {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
        }
        const result = deleteEmployeeId(id);
        if (result.success) {
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      case 'updateIdStatus': {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
        }
        const result = updateEmployeeIdStatus(id, status);
        if (result.success) {
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      case 'batchUpdate': {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
        }
        const result = batchUpdateEmployeeIds(ids, operation);
        return NextResponse.json({ success: true, data: result });
      }

      case 'searchIds': {
        const isAdmin = await verifyAdminAuth(request);
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
        }
        const results = searchEmployeeIds(query, status);
        return NextResponse.json({ success: true, data: results });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
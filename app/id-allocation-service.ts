import getDb from './db';

// ==================== 工号池管理功能 ====================

// 获取当前已分配的工号列表
const getCurrentlyAllocatedIds = () => {
  const rows = getDb().prepare('SELECT id FROM allocated_ids').all() as { id: number }[];
  return new Set(rows.map(row => row.id));
};

// 获取工号池统计信息
const getPoolStats = () => {
  const total = getDb().prepare('SELECT COUNT(*) as count FROM employee_pool').get() as { count: number };
  const available = getDb().prepare(`
    SELECT COUNT(*) as count FROM employee_pool
    WHERE status = 'available' AND id NOT IN (SELECT id FROM allocated_ids)
  `).get() as { count: number };
  const disabled = getDb().prepare('SELECT COUNT(*) as count FROM employee_pool WHERE status = \'disabled\'').get() as { count: number };
  const allocated = getDb().prepare('SELECT COUNT(*) as count FROM allocated_ids').get() as { count: number };

  return {
    total: total.count,
    available: available.count,
    disabled: disabled.count,
    allocated: allocated.count
  };
};

// 分配工号
const allocateId = (ipAddress: string, forceNewAllocation: boolean = false, currentId?: number) => {
  console.log(`ID allocation requested for IP: ${ipAddress}, forceNewAllocation: ${forceNewAllocation}`);

  // Check if this IP already has an allocated ID
  const existingAllocation = getDb().prepare('SELECT id FROM allocated_ids WHERE ipAddress = ?').get(ipAddress) as { id: number } | undefined;

  if (existingAllocation && !forceNewAllocation) {
    console.log(`IP ${ipAddress} already has allocated ID ${existingAllocation.id}. Returning existing allocation.`);
    return { id: existingAllocation.id, uniqueId: 'existing', ipAddress: ipAddress };
  }

  // If forceNewAllocation is true, release the existing allocation first
  if (existingAllocation && forceNewAllocation) {
    console.log(`Force allocation requested for IP ${ipAddress}. Releasing existing ID ${existingAllocation.id} first.`);
    getDb().prepare('DELETE FROM allocated_ids WHERE id = ?').run(existingAllocation.id);
  }

  // Get an available ID from the employee_pool that is not currently allocated and is enabled
  const availableIdRow = getDb().prepare(`
    SELECT id FROM employee_pool
    WHERE status = 'available'
      AND id NOT IN (SELECT id FROM allocated_ids)
      ${currentId !== undefined ? 'AND id != ?' : ''}
    ORDER BY RANDOM()
    LIMIT 1
  `).get() as { id: number } | undefined;

  if (!availableIdRow) {
    console.log('No available ID found in the pool');
    throw new Error('No available ID found in the pool');
  }

  const availableId = availableIdRow.id;
  console.log(`Available ID found: ${availableId}`);

  const uniqueSessionId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
  const allocationTime = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setHours(23, 59, 59, 999);
  const expiresAtISO = expiresAt.toISOString();

  console.log(`Allocating ID: ${availableId}, IP: ${ipAddress}`);

  getDb().transaction(() => {
    // Insert into allocated_ids
    getDb().prepare(
      'INSERT INTO allocated_ids (id, uniqueSessionId, allocationTime, ipAddress, expiresAt) VALUES (?, ?, ?, ?, ?)'
    ).run(
      availableId,
      uniqueSessionId,
      allocationTime,
      ipAddress,
      expiresAtISO
    );

    // Update employee_pool status to allocated
    getDb().prepare(
      'UPDATE employee_pool SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('allocated', availableId);
  })();

  console.log(`ID allocated successfully: ${availableId}`);
  return { id: availableId, uniqueId: uniqueSessionId, ipAddress: ipAddress };
};

// 释放工号
const releaseId = (id: number) => {
  console.log(`Releasing ID: ${id}`);

  getDb().transaction(() => {
    // Delete from allocated_ids
    const info = getDb().prepare('DELETE FROM allocated_ids WHERE id = ?').run(id);
    if (info.changes === 0) {
      console.log(`ID ${id} is not allocated or already released`);
      throw new Error('ID is not allocated or already released');
    }

    // Update employee_pool status back to available
    getDb().prepare(
      'UPDATE employee_pool SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('available', id);
  })();

  console.log(`ID ${id} released successfully`);
};

// 清理过期工号
const cleanupExpiredIds = () => {
  const now = new Date();
  const nowISO = now.toISOString();

  const expiredRows = getDb().prepare('SELECT id FROM allocated_ids WHERE expiresAt <= ?').all() as { id: number }[];

  if (expiredRows.length > 0) {
    getDb().transaction(() => {
      // Delete from allocated_ids
      getDb().prepare('DELETE FROM allocated_ids WHERE expiresAt <= ?').run(nowISO);

      // Update employee_pool status for expired IDs
      expiredRows.forEach(row => {
        getDb().prepare(
          'UPDATE employee_pool SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
        ).run('available', row.id);
      });
    })();

    console.log(`Cleaned up ${expiredRows.length} expired IDs`);
  }
};

// 清空所有已分配工号
const clearAllIds = () => {
  getDb().transaction(() => {
    // Get all allocated IDs before clearing
    const allocatedRows = getDb().prepare('SELECT id FROM allocated_ids').all() as { id: number }[];

    // Clear all allocated IDs
    getDb().prepare('DELETE FROM allocated_ids').run();

    // Reset all employee_pool status to available
    allocatedRows.forEach(row => {
      getDb().prepare(
        'UPDATE employee_pool SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
      ).run('available', row.id);
    });
  })();

  console.log('All IDs cleared');
};

// ==================== 管理员管理功能 ====================

// 验证管理员密码
const verifyAdminPassword = (password: string): boolean => {
  const result = getDb().prepare('SELECT value FROM passwords WHERE key = ?').get('login_password') as { value: string } | undefined;
  return result?.value === password;
};

// 修改管理员密码
const changeAdminPassword = (oldPassword: string, newPassword: string): boolean => {
  if (!verifyAdminPassword(oldPassword)) {
    return false;
  }

  getDb().prepare('UPDATE passwords SET value = ? WHERE key = ?').run(newPassword, 'login_password');
  return true;
};

// 创建管理员会话
const createAdminSession = (): string => {
  const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
  getDb().prepare('INSERT INTO admin_sessions (sessionId) VALUES (?)').run(sessionId);
  return sessionId;
};

// 验证管理员会话
const verifyAdminSession = (sessionId: string): boolean => {
  const result = getDb().prepare('SELECT sessionId FROM admin_sessions WHERE sessionId = ?').get(sessionId);
  if (result) {
    // Update last activity
    getDb().prepare('UPDATE admin_sessions SET lastActivity = CURRENT_TIMESTAMP WHERE sessionId = ?').run(sessionId);
    return true;
  }
  return false;
};

// 删除管理员会话
const deleteAdminSession = (sessionId: string): void => {
  getDb().prepare('DELETE FROM admin_sessions WHERE sessionId = ?').run(sessionId);
};

// 清理会话（删除过期会话，超过24小时）
const cleanupExpiredSessions = (): void => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = getDb().prepare('DELETE FROM admin_sessions WHERE lastActivity < ?').run(twentyFourHoursAgo);
  if (result.changes > 0) {
    console.log(`Cleaned up ${result.changes} expired admin sessions`);
  }
};

// ==================== 工号管理功能 ====================

// 获取所有工号信息（包含状态）
const getAllEmployeeIds = () => {
  const rows = getDb().prepare(`
    SELECT
      ep.id,
      ep.status,
      ep.createdAt,
      ep.updatedAt,
      ai.uniqueSessionId,
      ai.allocationTime,
      ai.ipAddress,
      ai.expiresAt
    FROM employee_pool ep
    LEFT JOIN allocated_ids ai ON ep.id = ai.id
    ORDER BY ep.id
  `).all() as Array<{
    id: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    uniqueSessionId: string | null;
    allocationTime: string | null;
    ipAddress: string | null;
    expiresAt: string | null;
  }>;

  return rows;
};

// 批量导入工号
const importEmployeeIds = (ids: number[]): { success: number; failed: number; errors: string[] } => {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  getDb().transaction(() => {
    ids.forEach(id => {
      try {
        // Check if ID already exists
        const existing = getDb().prepare('SELECT id FROM employee_pool WHERE id = ?').get(id);
        if (existing) {
          errors.push(`工号 ${id} 已存在`);
          failed++;
          return;
        }

        // Insert new ID
        getDb().prepare('INSERT INTO employee_pool (id, status) VALUES (?, ?)').run(id, 'available');
        success++;
      } catch (error) {
        errors.push(`工号 ${id} 导入失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    });
  })();

  return { success, failed, errors };
};

// 添加单个工号
const addEmployeeId = (id: number): { success: boolean; error?: string } => {
  try {
    const existing = getDb().prepare('SELECT id FROM employee_pool WHERE id = ?').get(id);
    if (existing) {
      return { success: false, error: `工号 ${id} 已存在` };
    }

    getDb().prepare('INSERT INTO employee_pool (id, status) VALUES (?, ?)').run(id, 'available');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 删除工号
const deleteEmployeeId = (id: number): { success: boolean; error?: string } => {
  try {
    // Check if ID is currently allocated
    const allocated = getDb().prepare('SELECT id FROM allocated_ids WHERE id = ?').get(id);
    if (allocated) {
      return { success: false, error: `工号 ${id} 正在使用中，无法删除` };
    }

    const result = getDb().prepare('DELETE FROM employee_pool WHERE id = ?').run(id);
    if (result.changes === 0) {
      return { success: false, error: `工号 ${id} 不存在` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 更新工号状态（启用/停用）
const updateEmployeeIdStatus = (id: number, status: 'available' | 'disabled'): { success: boolean; error?: string } => {
  try {
    // Check if ID exists
    const existing = getDb().prepare('SELECT id, status FROM employee_pool WHERE id = ?').get(id);
    if (!existing) {
      return { success: false, error: `工号 ${id} 不存在` };
    }

    // Cannot enable a disabled ID if it's already allocated
    if (status === 'available') {
      const allocated = getDb().prepare('SELECT id FROM allocated_ids WHERE id = ?').get(id);
      if (allocated) {
        return { success: false, error: `工号 ${id} 正在使用中，无法启用` };
      }
    }

    getDb().prepare('UPDATE employee_pool SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// 批量操作工号
const batchUpdateEmployeeIds = (ids: number[], action: 'enable' | 'disable' | 'delete'): { success: number; failed: number; errors: string[] } => {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  getDb().transaction(() => {
    ids.forEach(id => {
      let result: { success: boolean; error?: string };

      switch (action) {
        case 'enable':
          result = updateEmployeeIdStatus(id, 'available');
          break;
        case 'disable':
          result = updateEmployeeIdStatus(id, 'disabled');
          break;
        case 'delete':
          result = deleteEmployeeId(id);
          break;
        default:
          result = { success: false, error: '未知操作' };
      }

      if (result.success) {
        success++;
      } else {
        errors.push(`工号 ${id}: ${result.error}`);
        failed++;
      }
    });
  })();

  return { success, failed, errors };
};

// 搜索工号
const searchEmployeeIds = (query: string, status?: string) => {
  let sql = 'SELECT ep.id, ep.status, ep.createdAt, ep.updatedAt, ai.ipAddress FROM employee_pool ep LEFT JOIN allocated_ids ai ON ep.id = ai.id WHERE ep.id LIKE ?';
  const params: (string | number)[] = [`%${query}%`];

  if (status) {
    sql += ' AND ep.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY ep.id';

  return getDb().prepare(sql).all(...params) as Array<{
    id: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    ipAddress: string | null;
  }>;
};

export {
  // 工号分配相关
  allocateId,
  releaseId,
  cleanupExpiredIds,
  getCurrentlyAllocatedIds,
  clearAllIds,
  getPoolStats,

  // 管理员管理相关
  verifyAdminPassword,
  changeAdminPassword,
  createAdminSession,
  verifyAdminSession,
  deleteAdminSession,

  // 工号管理相关
  getAllEmployeeIds,
  importEmployeeIds,
  addEmployeeId,
  deleteEmployeeId,
  updateEmployeeIdStatus,
  batchUpdateEmployeeIds,
  searchEmployeeIds
};

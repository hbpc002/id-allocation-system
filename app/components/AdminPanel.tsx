"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface EmployeeId {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  uniqueSessionId?: string | null;
  allocationTime?: string | null;
  ipAddress?: string | null;
  expiresAt?: string | null;
}

interface AdminPanelProps {
  onLogout: () => void;
  adminSessionId: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, adminSessionId }) => {
  const [activeTab, setActiveTab] = useState<'view' | 'import' | 'manage' | 'password'>('view');
  const [employeeIds, setEmployeeIds] = useState<EmployeeId[]>([]);
  const [stats, setStats] = useState<{ total: number; available: number; disabled: number; allocated: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; uploadedCount: number; failedCount: number; totalPoolIds: number; errors: string[] } | null>(null);

  // Manage states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newId, setNewId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [idsRes, statsRes] = await Promise.all([
        fetch('/api/id-allocation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': adminSessionId
          },
          body: JSON.stringify({ action: 'getAllIds' })
        }),
        fetch('/api/id-allocation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-session': adminSessionId
          },
          body: JSON.stringify({ action: 'getPoolStats' })
        })
      ]);

      if (!idsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const idsData = await idsRes.json();
      const statsData = await statsRes.json();

      if (idsData.success) setEmployeeIds(idsData.data);
      if (statsData.success) setStats(statsData.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [adminSessionId]);

  useEffect(() => {
    if (adminSessionId) {
      fetchData();
    }
  }, [adminSessionId, fetchData]);

  // Handle file import
  const handleImport = async () => {
    if (!importFile) {
      setError('请选择文件');
      return;
    }

    setLoading(true);
    try {
      const text = await importFile.text();
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'x-admin-session': adminSessionId
        },
        body: text
      });

      const data = await response.json();
      if (data.success) {
        setImportResult(data);
        setMessage(`导入成功: ${data.uploadedCount} 个, 失败: ${data.failedCount || 0} 个`);
        setError(null);
        fetchData();
      } else {
        setError(data.error || '导入失败');
        setMessage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setLoading(false);
    }
  };

  // Add single ID
  const handleAddId = async () => {
    if (!newId) return;
    const id = parseInt(newId);
    if (isNaN(id)) {
      setError('请输入有效的工号');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'addId', id })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`工号 ${id} 添加成功`);
        setError(null);
        setNewId('');
        fetchData();
      } else {
        setError(data.error || '添加失败');
        setMessage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setLoading(false);
    }
  };

  // Batch update
  const handleBatchUpdate = async (operation: 'enable' | 'disable' | 'delete') => {
    if (selectedIds.length === 0) {
      setError('请先选择工号');
      return;
    }

    if (!confirm(`确定要对选中的 ${selectedIds.length} 个工号执行 ${operation === 'enable' ? '启用' : operation === 'disable' ? '停用' : '删除'} 操作吗？`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'batchUpdate', ids: selectedIds, operation })
      });

      const data = await response.json();
      if (data.success) {
        const result = data.data;
        setMessage(`操作完成: 成功 ${result.success} 个, 失败 ${result.failed} 个`);
        if (result.errors && result.errors.length > 0) {
          setError(`错误详情: ${result.errors.slice(0, 3).join('; ')}`);
        }
        setSelectedIds([]);
        fetchData();
      } else {
        setError(data.error || '批量操作失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量操作失败');
    } finally {
      setLoading(false);
    }
  };

  // Delete single ID
  const handleDeleteId = async (id: number) => {
    if (!confirm(`确定要删除工号 ${id} 吗？`)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'deleteId', id })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`工号 ${id} 已删除`);
        setError(null);
        fetchData();
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  // Update ID status
  const handleUpdateStatus = async (id: number, status: 'available' | 'disabled') => {
    setLoading(true);
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'updateIdStatus', id, status })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`工号 ${id} 状态已更新`);
        setError(null);
        fetchData();
      } else {
        setError(data.error || '更新失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('新密码和确认密码不匹配');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'changePassword', oldPassword, newPassword })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('密码修改成功');
        setError(null);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || '密码修改失败');
        setMessage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  // Search
  const handleSearch = async () => {
    if (!searchQuery) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'searchIds', query: searchQuery })
      });

      const data = await response.json();
      if (data.success) {
        setEmployeeIds(data.data);
        setError(null);
      } else {
        setError(data.error || '搜索失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection
  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select all
  const selectAll = () => {
    setSelectedIds(employeeIds.map(e => e.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">管理员面板</h2>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          退出登录
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b dark:border-gray-700">
        {[
          { key: 'view', label: '查看工号' },
          { key: 'import', label: '批量导入' },
          { key: 'manage', label: '单个管理' },
          { key: 'password', label: '修改密码' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'view' | 'import' | 'manage' | 'password')}
            className={`px-4 py-2 font-medium ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-4">加载中...</div>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">总工号</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">可用</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.allocated}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">已分配</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.disabled}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">已停用</div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'view' && (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="搜索工号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                搜索
              </button>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                刷新
              </button>
            </div>

            {selectedIds.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded flex gap-2 items-center">
                <span className="font-medium">已选择 {selectedIds.length} 个</span>
                <button onClick={selectAll} className="text-sm px-2 py-1 bg-blue-600 text-white rounded">
                  全选
                </button>
                <button onClick={clearSelection} className="text-sm px-2 py-1 bg-gray-600 text-white rounded">
                  清除
                </button>
                <button onClick={() => handleBatchUpdate('enable')} className="text-sm px-2 py-1 bg-green-600 text-white rounded">
                  启用
                </button>
                <button onClick={() => handleBatchUpdate('disable')} className="text-sm px-2 py-1 bg-orange-600 text-white rounded">
                  停用
                </button>
                <button onClick={() => handleBatchUpdate('delete')} className="text-sm px-2 py-1 bg-red-600 text-white rounded">
                  删除
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 text-left">选择</th>
                    <th className="p-2 text-left">工号</th>
                    <th className="p-2 text-left">状态</th>
                    <th className="p-2 text-left">IP地址</th>
                    <th className="p-2 text-left">分配时间</th>
                    <th className="p-2 text-left">过期时间</th>
                    <th className="p-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeIds.map((item) => (
                    <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelection(item.id)}
                        />
                      </td>
                      <td className="p-2 font-medium">{item.id}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.status === 'available' ? 'bg-green-100 text-green-800' :
                          item.status === 'allocated' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'available' ? '可用' :
                           item.status === 'allocated' ? '已分配' : '已停用'}
                        </span>
                      </td>
                      <td className="p-2 text-gray-600 dark:text-gray-400">{item.ipAddress || '-'}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-400">
                        {item.allocationTime ? new Date(item.allocationTime).toLocaleString() : '-'}
                      </td>
                      <td className="p-2 text-gray-600 dark:text-gray-400">
                        {item.expiresAt ? new Date(item.expiresAt).toLocaleString() : '-'}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          {item.status === 'disabled' ? (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'available')}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              启用
                            </button>
                          ) : item.status === 'available' ? (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'disabled')}
                              className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                            >
                              停用
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleDeleteId(item.id)}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">选择文本文件（每行一个工号）</label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              {importFile && (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="font-medium">文件: {importFile.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">大小: {(importFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={!importFile || loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
              >
                {loading ? '导入中...' : '开始导入'}
              </button>
              {importResult && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="font-medium text-green-800 dark:text-green-300">导入结果:</p>
                  <p>成功: {importResult.uploadedCount} 个</p>
                  <p>失败: {importResult.failedCount || 0} 个</p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      <p>错误详情:</p>
                      <ul className="list-disc list-inside">
                        {importResult.errors.slice(0, 5).map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                        {importResult.errors.length > 5 && <li>...</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <p className="font-medium mb-2">说明:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>每行一个工号（纯数字）</li>
                  <li>重复的工号会被自动跳过</li>
                  <li>导入后状态默认为可用</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div>
            <div className="space-y-6">
              {/* Add ID */}
              <div className="p-4 border rounded dark:border-gray-600">
                <h3 className="font-bold mb-3">添加单个工号</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="输入工号"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                    onClick={handleAddId}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border rounded dark:border-gray-600">
                <h3 className="font-bold mb-3">快速操作</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (confirm('确定要清空所有已分配的工号吗？')) {
                        fetch('/api/id-allocation', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-admin-session': adminSessionId
                          },
                          body: JSON.stringify({ action: 'clearAll' })
                        }).then(res => res.json()).then(data => {
                          if (data.success) {
                            setMessage('已清空所有已分配工号');
                            fetchData();
                          } else {
                            setError(data.error || '清空失败');
                          }
                        });
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    清空所有已分配工号
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div>
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block mb-1 font-medium">旧密码</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
              >
                {loading ? '修改中...' : '修改密码'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

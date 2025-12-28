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
  const [activeTab, setActiveTab] = useState<'view' | 'import' | 'manage' | 'password' | 'quotes'>('view');
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

  // Quote states
  const [quotes, setQuotes] = useState<Array<{ id: number; quote: string; source: string; createdAt: string }>>([]);
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [quoteImportResult, setQuoteImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [popupInterval, setPopupInterval] = useState<number>(86400000); // 默认24小时
  const [activeQuoteSubTab, setActiveQuoteSubTab] = useState<'import' | 'list' | 'settings'>('import');

  // Fetch quote interval (defined before use to avoid hoisting issues)
  const fetchQuoteInterval = useCallback(async () => {
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getQuoteInterval' })
      });

      const data = await response.json();
      if (data.success) {
        setPopupInterval(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch quote interval:', err);
    }
  }, []);

  // Fetch quotes (defined before use to avoid hoisting issues)
  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'getAllQuotes' })
      });

      const data = await response.json();
      if (data.success) {
        setQuotes(data.data);
        setError(null);
      } else {
        setError(data.error || '获取名言失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取名言失败');
    } finally {
      setLoading(false);
    }
  }, [adminSessionId]);

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
      fetchQuoteInterval();
    }
  }, [adminSessionId, fetchData, fetchQuoteInterval]);

  // Load quotes when switching to quotes tab
  useEffect(() => {
    if (activeTab === 'quotes' && adminSessionId) {
      fetchQuotes();
    }
  }, [activeTab, adminSessionId, fetchQuotes]);

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

  // Import quotes
  const handleImportQuotes = async () => {
    if (!quoteFile) {
      setError('请选择文件');
      return;
    }

    setLoading(true);
    try {
      const text = await quoteFile.text();
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'importQuotes', text })
      });

      const data = await response.json();
      if (data.success) {
        setQuoteImportResult({
          success: data.uploadedCount,
          failed: data.failedCount,
          errors: data.errors || []
        });
        setMessage(`导入成功: ${data.uploadedCount} 条, 失败: ${data.failedCount || 0} 条`);
        setError(null);
        fetchQuotes();
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

  // Delete quote
  const handleDeleteQuote = async (id: number) => {
    if (!confirm('确定要删除这条名言吗？')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'deleteQuote', id })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('名言已删除');
        setError(null);
        fetchQuotes();
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  // Save popup interval
  const handleSaveInterval = async () => {
    if (popupInterval < 0) {
      setError('间隔时间必须是非负数字');
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
        body: JSON.stringify({ action: 'setQuoteInterval', interval: popupInterval })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('弹窗间隔已更新');
        setError(null);
      } else {
        setError(data.error || '更新失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败');
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
      <div className="flex space-x-2 mb-6 border-b dark:border-gray-700 overflow-x-auto">
        {[
          { key: 'view', label: '查看工号' },
          { key: 'import', label: '批量导入' },
          { key: 'manage', label: '单个管理' },
          { key: 'password', label: '修改密码' },
          { key: 'quotes', label: '名言管理' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'view' | 'import' | 'manage' | 'password' | 'quotes')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
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

        {activeTab === 'quotes' && (
          <div>
            <div className="space-y-6">
              {/* 子标签导航 */}
              <div className="flex space-x-2 border-b dark:border-gray-700">
                {[
                  { key: 'import', label: '批量导入' },
                  { key: 'list', label: '名言列表' },
                  { key: 'settings', label: '弹窗设置' }
                ].map(subTab => (
                  <button
                    key={subTab.key}
                    onClick={() => setActiveQuoteSubTab(subTab.key as 'import' | 'list' | 'settings')}
                    className={`px-3 py-1 text-sm font-medium ${
                      activeQuoteSubTab === subTab.key
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {/* 子标签内容 */}
              {activeQuoteSubTab === 'import' && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">选择文本文件批量导入名言</label>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={(e) => setQuoteFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  {quoteFile && (
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                      <p className="font-medium">文件: {quoteFile.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">大小: {(quoteFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  )}
                  <button
                    onClick={handleImportQuotes}
                    disabled={!quoteFile || loading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                  >
                    {loading ? '导入中...' : '开始导入'}
                  </button>
                  {quoteImportResult && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="font-medium text-green-800 dark:text-green-300">导入结果:</p>
                      <p>成功: {quoteImportResult.success} 条</p>
                      <p>失败: {quoteImportResult.failed} 条</p>
                      {quoteImportResult.errors && quoteImportResult.errors.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          <p>错误详情:</p>
                          <ul className="list-disc list-inside">
                            {quoteImportResult.errors.slice(0, 5).map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                            ))}
                            {quoteImportResult.errors.length > 5 && <li>...</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                    <p className="font-medium mb-2">说明:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>每行一条名言，格式: <code className="bg-white dark:bg-gray-800 px-1 rounded">名言内容|来源</code></li>
                      <li>来源可以是作者名或电影名</li>
                      <li>来源为空时默认为佚名</li>
                      <li>重复的名言会被自动跳过</li>
                      <li>示例: <code className="bg-white dark:bg-gray-800 px-1 rounded">天道酬勤，厚德载物|老子</code></li>
                    </ul>
                  </div>
                </div>
              )}

              {activeQuoteSubTab === 'list' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">名言列表 ({quotes.length} 条)</h3>
                    <button
                      onClick={fetchQuotes}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                    >
                      刷新
                    </button>
                  </div>
                  {quotes.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">暂无名言，请先导入</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="p-2 text-left">ID</th>
                            <th className="p-2 text-left">名言内容</th>
                            <th className="p-2 text-left">来源</th>
                            <th className="p-2 text-left">创建时间</th>
                            <th className="p-2 text-left">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotes.map((item) => (
                            <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="p-2">{item.id}</td>
                              <td className="p-2 max-w-xs truncate" title={item.quote}>{item.quote}</td>
                              <td className="p-2">{item.source}</td>
                              <td className="p-2 text-gray-600 dark:text-gray-400 text-xs">
                                {new Date(item.createdAt).toLocaleString()}
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={() => handleDeleteQuote(item.id)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeQuoteSubTab === 'settings' && (
                <div className="space-y-4">
                  <div className="p-4 border rounded dark:border-gray-600">
                    <h3 className="font-bold mb-3">弹窗显示间隔设置</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block mb-1 font-medium">间隔时间（小时）</label>
                        <input
                          type="number"
                          value={Math.floor(popupInterval / 3600000)}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value || '0');
                            setPopupInterval(hours * 3600000);
                          }}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          min="0"
                          placeholder="输入小时数，0表示每次刷新都显示"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          当前值: {Math.floor(popupInterval / 3600000)} 小时 ({popupInterval} 毫秒)
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          提示: 24小时 = 86400000毫秒，0表示每次刷新都显示
                        </p>
                      </div>
                      <button
                        onClick={handleSaveInterval}
                        disabled={loading}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                      >
                        {loading ? '保存中...' : '保存设置'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

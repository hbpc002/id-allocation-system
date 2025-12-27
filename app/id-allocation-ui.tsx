"use client";

import React, { useState, useEffect } from 'react';
import { useIdAllocation } from './hooks/useIdAllocation';
import { IdAllocationForm } from './components/IdAllocationForm';
import { IdAllocationStatus } from './components/IdAllocationStatus';
import { AdminPanel } from './components/AdminPanel';

const IdAllocationUI = () => {
  const {
    allocatedIds,
    allocatedId,
    errorMessage,
    currentTime,
    totalIds,
    availableIds,
    disabledIds,
    allocatedIdsCount,
    handleClockIn,
    handleClockOut,
    handleClearAll,
    uploadEmployeePool,
  } = useIdAllocation();

  const [viewMode, setViewMode] = useState<'user' | 'login' | 'admin'>('user');
  const [adminSessionId, setAdminSessionId] = useState<string | null>(null);
  const [loginPassword, setLoginPassword] = useState('');

  // Check for saved admin session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('adminSessionId');
    if (savedSession) {
      // Verify session is still valid
      fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': savedSession
        },
        body: JSON.stringify({ action: 'verifySession' })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          setAdminSessionId(savedSession);
          setViewMode('admin');
        } else {
          localStorage.removeItem('adminSessionId');
        }
      });
    }
  }, []);

  // Handle admin login
  const handleAdminLogin = async () => {
    if (!loginPassword) {
      alert('请输入密码');
      return;
    }

    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adminLogin', password: loginPassword })
      });

      const data = await response.json();
      if (data.success) {
        setAdminSessionId(data.sessionId);
        localStorage.setItem('adminSessionId', data.sessionId);
        setViewMode('admin');
        setLoginPassword('');
      } else {
        alert('密码错误');
      }
    } catch (error) {
      alert('登录失败: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleLogout = () => {
    if (adminSessionId) {
      // Clear session from server (optional, best effort)
      fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'logout' })
      }).catch(() => {});
    }
    localStorage.removeItem('adminSessionId');
    setAdminSessionId(null);
    setViewMode('user');
  };

  // Auto-refresh allocated IDs for scrolling effect
  // Filter out the current user's ID from allocatedIds to avoid duplicates
  // The current user's ID will be added separately with "Your IP" label
  const scrollingIds = allocatedIds
    .filter(item => item.id !== allocatedId)
    .concat(allocatedId !== null ? [{ id: allocatedId, ipAddress: 'Your IP' }] : []);

  return (
    <div className="w-full max-w-6xl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            工号分配系统
          </h1>
          <div className="flex gap-2">
            {viewMode === 'user' && (
              <button
                onClick={() => setViewMode('login')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                管理员登录
              </button>
            )}
            {viewMode === 'login' && (
              <button
                onClick={() => setViewMode('user')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                返回
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Mode */}
      {viewMode === 'user' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          {errorMessage && (
            <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
          )}

          {/* Your Allocated ID */}
          {allocatedId !== null && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">您的工号</p>
              <p className="text-4xl font-extrabold text-blue-800 dark:text-blue-300">{allocatedId}</p>
            </div>
          )}

          <IdAllocationForm
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onClearAll={() => handleClearAll(adminSessionId || '')}
            onUploadPool={(file) => uploadEmployeePool(file, adminSessionId || '')}
            isLoggedIn={!!adminSessionId}
          />

          <IdAllocationStatus
            totalIds={totalIds}
            availableIds={availableIds}
            disabledIds={disabledIds}
            allocatedIdsCount={allocatedIdsCount}
            currentTime={currentTime}
          />

          {/* Scrolling Allocated IDs */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
              已分配工号 (实时滚动)
            </h3>
            {scrollingIds.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">暂无已分配工号</p>
            ) : (
              <div
                className="h-32 overflow-hidden border rounded dark:border-gray-600 bg-gray-50 dark:bg-gray-900 relative cursor-grab active:cursor-grabbing"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget.querySelector('.scroll-content') as HTMLElement & { scrollTimeout?: NodeJS.Timeout };
                  if (target) {
                    target.style.animationPlayState = 'paused';
                    const currentTransform = target.style.transform;
                    const currentOffset = currentTransform
                      ? parseFloat(currentTransform.replace('translateY(-', '').replace('px)', ''))
                      : 0;
                    const newOffset = Math.max(0, currentOffset + e.deltaY);
                    target.style.transform = `translateY(-${newOffset}px)`;
                    // Resume animation after 2 seconds of no wheel activity
                    if (target.scrollTimeout) clearTimeout(target.scrollTimeout);
                    target.scrollTimeout = setTimeout(() => {
                      target.style.animationPlayState = 'running';
                    }, 2000);
                  }
                }}
              >
                <div className="scroll-content animate-scrolling absolute w-full">
                  {scrollingIds.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="font-bold text-blue-600 dark:text-blue-400">{item.id}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.ipAddress}</span>
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {scrollingIds.map((item, index) => (
                    <div
                      key={`dup-${index}`}
                      className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="font-bold text-blue-600 dark:text-blue-400">{item.id}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.ipAddress}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Mode */}
      {viewMode === 'login' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">管理员登录</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">密码</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminLogin();
                }}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="请输入管理员密码"
              />
            </div>
            <button
              onClick={handleAdminLogin}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              登录
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              默认密码: root123
            </p>
          </div>
        </div>
      )}

      {/* Admin Mode */}
      {viewMode === 'admin' && adminSessionId && (
        <AdminPanel
          onLogout={handleLogout}
          adminSessionId={adminSessionId}
        />
      )}
    </div>
  );
};

export default IdAllocationUI;

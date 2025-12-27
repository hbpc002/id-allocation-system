"use client";

import React, { useState, useEffect, useRef } from 'react';
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

  // Build scrolling list with proper deduplication
  // The key insight: allocatedIds from API already contains ALL allocated IDs including current user's
  // So we just need to ensure uniqueness and add "Your IP" label for current user
  const scrollingIds = (() => {
    // Create a map to ensure uniqueness by ID
    const idMap = new Map<number, { id: number; ipAddress: string }>();

    // Add all allocated IDs from API
    for (const item of allocatedIds) {
      if (!idMap.has(item.id)) {
        idMap.set(item.id, item);
      }
    }

    // If current user has an ID, mark it with "Your IP"
    if (allocatedId !== null) {
      idMap.set(allocatedId, { id: allocatedId, ipAddress: 'Your IP' });
    }

    // Convert back to array
    return Array.from(idMap.values()).sort((a, b) => a.id - b.id);
  })();

  // Ref for scroll container to add wheel event listener
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Wheel handler for manual scroll control
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const target = container.querySelector('.scroll-content') as HTMLElement & { scrollTimeout?: NodeJS.Timeout };
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
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scrollingIds]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-medium text-slate-800">
            工号分配系统
          </h1>
          <div className="flex gap-2">
            {viewMode === 'user' && (
              <button
                onClick={() => setViewMode('login')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                管理员登录
              </button>
            )}
            {viewMode === 'login' && (
              <button
                onClick={() => setViewMode('user')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                返回
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Mode */}
      {viewMode === 'user' && (
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Your Allocated ID */}
          {allocatedId !== null && (
            <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl text-center">
              <p className="text-sm text-indigo-600 mb-2 font-medium">您的工号</p>
              <p className="text-5xl font-bold text-indigo-700 tracking-tight">{allocatedId}</p>
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
            <h3 className="text-sm font-medium text-slate-600 mb-2">
              已分配工号 (实时滚动)
            </h3>
            {scrollingIds.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-slate-100">
                暂无已分配工号
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="h-40 overflow-hidden border border-slate-200 rounded-xl bg-white/60 backdrop-blur-sm relative"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)'
                }}
              >
                <div className="scroll-content animate-scrolling absolute w-full">
                  {scrollingIds.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <span className={`font-semibold ${item.ipAddress === 'Your IP' ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {item.id}
                        {item.ipAddress === 'Your IP' && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                            您的工号
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{item.ipAddress}</span>
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {scrollingIds.map((item, index) => (
                    <div
                      key={`dup-${index}`}
                      className="flex justify-between items-center px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <span className={`font-semibold ${item.ipAddress === 'Your IP' ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {item.id}
                        {item.ipAddress === 'Your IP' && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                            您的工号
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{item.ipAddress}</span>
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
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-sm max-w-md mx-auto">
          <h2 className="text-2xl font-medium text-slate-800 mb-6 text-center">管理员登录</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">密码</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminLogin();
                }}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="请输入管理员密码"
              />
            </div>
            <button
              onClick={handleAdminLogin}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              登录
            </button>
            <p className="text-xs text-slate-500 text-center">
              默认密码: <code className="bg-slate-100 px-2 py-1 rounded">root123</code>
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

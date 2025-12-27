"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useIdAllocation } from './hooks/useIdAllocation';
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

  // Build scrolling list - ensure NO duplicates
  // allocatedIds from API contains all allocated IDs
  // We need to: 1) Remove duplicates, 2) Mark current user's ID
  const scrollingIds = (() => {
    // Use Map to ensure uniqueness
    const uniqueMap = new Map<number, { id: number; ipAddress: string }>();

    // Add all from API, but track what we've seen
    for (const item of allocatedIds) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }

    // If user has an ID, ensure it's marked with "Your IP"
    if (allocatedId !== null) {
      uniqueMap.set(allocatedId, { id: allocatedId, ipAddress: 'Your IP' });
    }

    // Convert to sorted array
    return Array.from(uniqueMap.values()).sort((a, b) => a.id - b.id);
  })();

  // Ref for scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Wheel handler
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
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="border border-black rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">工号分配系统</h1>
          <div className="flex gap-2">
            {viewMode === 'user' && (
              <button
                onClick={() => setViewMode('login')}
                className="px-3 py-1.5 border border-black bg-white hover:bg-black hover:text-white text-black rounded text-sm font-medium transition-colors"
              >
                管理员登录
              </button>
            )}
            {viewMode === 'login' && (
              <button
                onClick={() => setViewMode('user')}
                className="px-3 py-1.5 border border-black bg-white hover:bg-black hover:text-white text-black rounded text-sm font-medium transition-colors"
              >
                返回
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Mode */}
      {viewMode === 'user' && (
        <div className="border border-black rounded-lg p-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-3 p-2 border border-black bg-white text-sm">
              {errorMessage}
            </div>
          )}

          {/* Your Allocated ID */}
          {allocatedId !== null && (
            <div className="mb-4 p-4 border border-black text-center">
              <p className="text-xs mb-1">您的工号</p>
              <p className="text-4xl font-bold">{allocatedId}</p>
            </div>
          )}

          {/* Form Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button
              onClick={() => handleClockIn()}
              className="px-4 py-2 border border-black bg-white hover:bg-black hover:text-white text-black rounded font-medium transition-colors"
            >
              申请工号
            </button>
            <button
              onClick={handleClockOut}
              className="px-4 py-2 border border-black bg-white hover:bg-black hover:text-white text-black rounded font-medium transition-colors"
            >
              释放工号
            </button>
            {adminSessionId && (
              <>
                <button
                  onClick={() => handleClearAll(adminSessionId)}
                  className="px-4 py-2 border border-black bg-white hover:bg-black hover:text-white text-black rounded font-medium transition-colors"
                >
                  清空所有
                </button>
                <button
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className="px-4 py-2 border border-black bg-white hover:bg-black hover:text-white text-black rounded font-medium transition-colors"
                >
                  上传工号池
                </button>
              </>
            )}
            <input
              id="fileInput"
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && adminSessionId) {
                  uploadEmployeePool(file, adminSessionId);
                  e.target.value = '';
                }
              }}
            />
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="border border-black p-2">
              <p className="text-[10px]">工号总数</p>
              <p className="text-lg font-bold">{totalIds}</p>
            </div>
            <div className="border border-black p-2">
              <p className="text-[10px]">可用工号</p>
              <p className="text-lg font-bold">{availableIds}</p>
            </div>
            <div className="border border-black p-2">
              <p className="text-[10px]">已分配</p>
              <p className="text-lg font-bold">{allocatedIdsCount}</p>
            </div>
            <div className="border border-black p-2">
              <p className="text-[10px]">已停用</p>
              <p className="text-lg font-bold">{disabledIds}</p>
            </div>
          </div>

          {/* Time */}
          <div className="border border-black p-2 mb-4 text-center text-xs">
            {currentTime.toLocaleTimeString('zh-CN')}
          </div>

          {/* Scrolling List */}
          <div className="border border-black">
            <div className="p-2 text-xs font-bold border-b border-black">
              已分配工号 (实时滚动)
            </div>
            {scrollingIds.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">暂无数据</div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="h-48 overflow-hidden relative"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
                }}
              >
                <div className="scroll-content animate-scrolling absolute w-full">
                  {/* First set */}
                  {scrollingIds.map((item, index) => (
                    <div key={index} className="flex justify-between px-3 py-2 border-b border-gray-200 text-sm">
                      <span className={item.ipAddress === 'Your IP' ? 'font-bold' : ''}>
                        {item.id}
                        {item.ipAddress === 'Your IP' && <span className="ml-2 text-xs">[您的]</span>}
                      </span>
                      <span className="text-xs">{item.ipAddress}</span>
                    </div>
                  ))}
                  {/* Second set for seamless loop */}
                  {scrollingIds.map((item, index) => (
                    <div key={`dup-${index}`} className="flex justify-between px-3 py-2 border-b border-gray-200 text-sm">
                      <span className={item.ipAddress === 'Your IP' ? 'font-bold' : ''}>
                        {item.id}
                        {item.ipAddress === 'Your IP' && <span className="ml-2 text-xs">[您的]</span>}
                      </span>
                      <span className="text-xs">{item.ipAddress}</span>
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
        <div className="border border-black rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4 text-center">管理员登录</h2>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-bold">密码</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminLogin();
                }}
                className="w-full px-3 py-2 border border-black rounded bg-white focus:outline-none"
                placeholder="输入密码"
              />
            </div>
            <button
              onClick={handleAdminLogin}
              className="w-full py-2 border border-black bg-white hover:bg-black hover:text-white rounded font-medium transition-colors"
            >
              登录
            </button>
            <p className="text-xs text-center">
              默认密码: <span className="font-mono">root123</span>
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

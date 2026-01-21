"use client";

import React, { useState, useEffect } from 'react';
import { useIdAllocation } from './hooks/useIdAllocation';
import { AdminPanel } from './components/AdminPanel';
import MotivationalQuoteModal from './components/MotivationalQuoteModal';

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
    copySuccess,
    handleClockIn,
    handleClockOut,
    handleClearAll,
    uploadEmployeePool,
  } = useIdAllocation();

  const [viewMode, setViewMode] = useState<'user' | 'login' | 'admin'>('user');
  const [adminSessionId, setAdminSessionId] = useState<string | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchFadeOutDelay();
  }, []);

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<{ quote: string; source: string } | null>(null);
  const [fadeOutDelay, setFadeOutDelay] = useState(5000); // 默认5秒

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

  // Check and show motivational quote on mount
  useEffect(() => {
    const checkAndShowQuote = async () => {
      try {
        // Get configured interval
        const intervalResponse = await fetch('/api/id-allocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getQuoteInterval' })
        });

        const intervalData = await intervalResponse.json();
        if (!intervalData.success) return;

        const interval = intervalData.data; // milliseconds

        // Check localStorage for last show time
        const lastShow = localStorage.getItem('quoteLastShow');
        const now = Date.now();

        // If never shown or interval exceeded
        if (!lastShow || (now - parseInt(lastShow)) >= interval) {
          // Get random quote
          const quoteResponse = await fetch('/api/id-allocation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getRandomQuote' })
          });

          const quoteData = await quoteResponse.json();
          if (quoteData.success && quoteData.data) {
            setCurrentQuote(quoteData.data);
            setShowQuoteModal(true);
            localStorage.setItem('quoteLastShow', now.toString());
          }
        }
      } catch (error) {
        console.error('Error checking quote:', error);
      }
    };

    // Only show in user mode
    if (viewMode === 'user') {
      checkAndShowQuote();
    }
  }, [viewMode]);

  // Fetch fade out delay
  const fetchFadeOutDelay = async () => {
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getFadeOutDelay' })
      });

      const data = await response.json();
      if (data.success) {
        setFadeOutDelay(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch fade out delay:', err);
    }
  };

  // Close quote modal
  const handleCloseQuote = () => {
    setShowQuoteModal(false);
    setCurrentQuote(null);
  };

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
  // We need to: 1) Remove duplicates, 2) Keep the actual IP from API
  const scrollingIds = (() => {
    // Use Map to ensure uniqueness
    const uniqueMap = new Map<number, { id: number; ipAddress: string; allocationTime?: string }>();

    // Add all from API, but track what we've seen
    for (const item of allocatedIds) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }

    // Convert to sorted array
    const result = Array.from(uniqueMap.values()).sort((a, b) => a.id - b.id);

    // Debug logging
    console.log('Allocated IDs from API:', allocatedIds);
    console.log('Unique IDs after dedup:', result);
    console.log('Current user allocated ID:', allocatedId);

    return result;
  })();

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 font-sans">
      {/* Header - Happy Coder Style: Minimal, functional */}
      <div className="border border-gray-900 bg-white mb-4">
        <div className="px-4 py-3 flex justify-between items-center border-b border-gray-900">
          <h1 className="text-lg font-bold">分机号分配系统</h1>
          <div className="flex gap-1">
            {viewMode === 'user' && (
              <button
                onClick={() => setViewMode('login')}
                className="px-3 py-1 text-xs border border-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors"
              >
                管理员
              </button>
            )}
            {viewMode === 'login' && (
              <button
                onClick={() => setViewMode('user')}
                className="px-3 py-1 text-xs border border-gray-900 bg-white hover:bg-gray-900 hover:text-white transition-colors"
              >
                返回
              </button>
            )}
          </div>
        </div>

        {/* User Mode */}
        {viewMode === 'user' && (
          <div className="p-4 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-2 border border-gray-900 bg-gray-50 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Your Allocated ID - Prominent display */}
            {allocatedId !== null && (
              <div className="p-4 border border-gray-900 bg-white text-center">
                <div className="text-xs text-gray-600 mb-1">您的分机号</div>
                <div className="text-4xl font-bold tracking-tighter">{allocatedId}</div>
                {copySuccess && (
                  <div className="text-xs text-green-600 mt-1">分机号已自动复制，可直接粘贴使用</div>
                )}
              </div>
            )}

            {/* Action Buttons - Compact, functional */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleClockIn()}
                className="py-2 border border-gray-900 bg-white hover:bg-gray-900 hover:text-white font-medium text-sm transition-colors"
              >
                申请
              </button>
              <button
                onClick={handleClockOut}
                className="py-2 border border-gray-900 bg-white hover:bg-gray-900 hover:text-white font-medium text-sm transition-colors"
              >
                释放
              </button>
              {adminSessionId && (
                <>
                  <button
                    onClick={() => handleClearAll(adminSessionId)}
                    className="py-2 border border-gray-900 bg-white hover:bg-gray-900 hover:text-white font-medium text-sm transition-colors"
                  >
                    清空所有
                  </button>
                  <button
                    onClick={() => document.getElementById('fileInput')?.click()}
                    className="py-2 border border-gray-900 bg-white hover:bg-gray-900 hover:text-white font-medium text-sm transition-colors"
                  >
                    上传分机号池
                  </button>
                </>
              )}
            </div>

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

            {/* Stats - Compact 2x2 grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-gray-900 p-2 bg-gray-50">
                <div className="text-[10px] text-gray-600">分机号总数</div>
                <div className="text-base font-bold">{totalIds}</div>
              </div>
              <div className="border border-gray-900 p-2 bg-gray-50">
                <div className="text-[10px] text-gray-600">可用分机号</div>
                <div className="text-base font-bold">{availableIds}</div>
              </div>
              <div className="border border-gray-900 p-2 bg-gray-50">
                <div className="text-[10px] text-gray-600">已分配</div>
                <div className="text-base font-bold">{allocatedIdsCount}</div>
              </div>
              <div className="border border-gray-900 p-2 bg-gray-50">
                <div className="text-[10px] text-gray-600">已停用</div>
                <div className="text-base font-bold">{disabledIds}</div>
              </div>
            </div>

            {/* Time */}
            <div className="border border-gray-900 p-2 text-center text-xs font-mono bg-gray-50">
              {mounted ? currentTime.toLocaleTimeString('zh-CN') : ''}
            </div>

            {/* Scrolling List - Auto-scroll only when content exceeds container */}
            <div className="border border-gray-900">
              <div className="px-3 py-2 text-xs font-bold border-b border-gray-900 bg-gray-50">
                已分配分机号
              </div>
              {scrollingIds.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">暂无数据</div>
              ) : (
                <div className="h-40 overflow-hidden relative" style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)'
                }}>
                  <div className={`absolute w-full ${scrollingIds.length > 8 ? 'scroll-content animate-scrolling' : ''}`}>
                    {scrollingIds.map((item, index) => (
                      <div key={index} className="flex justify-between px-3 py-1.5 border-b border-gray-200 text-xs">
                        <span>
                          {item.id}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {item.ipAddress}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {item.allocationTime ? new Date(item.allocationTime).toLocaleTimeString('zh-CN') : ''}
                        </span>
                      </div>
                    ))}
                    {scrollingIds.length > 8 && scrollingIds.map((item, index) => (
                      <div key={`dup-${index}`} className="flex justify-between px-3 py-1.5 border-b border-gray-200 text-xs">
                        <span>
                          {item.id}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {item.ipAddress}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {item.allocationTime ? new Date(item.allocationTime).toLocaleTimeString('zh-CN') : ''}
                        </span>
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
          <div className="p-4 space-y-3">
            <div className="text-center font-bold text-sm">管理员登录</div>
            <div>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminLogin();
                }}
                className="w-full px-3 py-2 border border-gray-900 bg-white focus:outline-none text-sm"
                placeholder="密码"
              />
            </div>
            <button
              onClick={handleAdminLogin}
              className="w-full py-2 border border-gray-900 bg-white hover:bg-gray-900 hover:text-white font-medium text-sm transition-colors"
            >
              登录
            </button>
          </div>
        )}

        {/* Admin Mode */}
        {viewMode === 'admin' && adminSessionId && (
          <div className="p-4">
            <AdminPanel
              onLogout={handleLogout}
              adminSessionId={adminSessionId}
            />
          </div>
        )}
      </div>

      {/* Motivational Quote Modal (guarded until mounted) */}
      {mounted && showQuoteModal && currentQuote && (
        <MotivationalQuoteModal
          quote={currentQuote.quote}
          source={currentQuote.source}
          fadeDelay={fadeOutDelay}
          onClose={handleCloseQuote}
        />
      )}
    </div>
  );
};

export default IdAllocationUI;

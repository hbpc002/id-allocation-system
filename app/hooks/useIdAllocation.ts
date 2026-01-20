"use client";

import { useState, useEffect } from 'react';

// Fallback clipboard function for HTTP environments
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Try Clipboard API first (requires HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback to execCommand for HTTP environments
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.opacity = '0';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
    
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
};

interface AllocatedIdInfo {
  id: number;
  ipAddress: string;
  allocationTime?: string;
}

// Create a consistent date initialization to avoid hydration mismatch
const getInitialDate = (): Date => {
  return new Date(Date.UTC(2000, 0, 1, 0, 0, 0));
};

export const useIdAllocation = () => {
  const [allocatedIds, setAllocatedIds] = useState<AllocatedIdInfo[]>([]);
  const [allocatedId, setAllocatedId] = useState<number | null>(null);
  const [uniqueSessionId, setUniqueSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(getInitialDate());
  const [totalIds, setTotalIds] = useState<number>(0);
  const [availableIds, setAvailableIds] = useState<number>(0);
  const [disabledIds, setDisabledIds] = useState<number>(0);
  const [allocatedIdsCount, setAllocatedIdsCount] = useState<number>(0);

  // Refresh allocated IDs and total pool count from the server
  const refreshData = async () => {
    try {
      const res = await fetch('/api/id-allocation');
      if (!res.ok) {
        // Don't throw error for failed fetch, just log and return silently
        // This prevents UI errors during initial load or network issues
        console.log(`API returned ${res.status}, skipping update`);
        return;
      }
      const data = await res.json();
      if (data.allocatedIds) {
        setAllocatedIds(data.allocatedIds);
      }
      if (data.totalPoolIds !== undefined) {
        setTotalIds(data.totalPoolIds);
      }
      if (data.availableIds !== undefined) {
        setAvailableIds(data.availableIds);
      }
      if (data.disabledIds !== undefined) {
        setDisabledIds(data.disabledIds);
      }
      if (data.allocatedIdsCount !== undefined) {
        setAllocatedIdsCount(data.allocatedIdsCount);
      }
      // Only update allocatedId if the API returns a valid ID
      // This prevents overwriting a locally set ID with null from API
      if (data.clientAllocatedId !== undefined && data.clientAllocatedId !== null) {
        setAllocatedId(data.clientAllocatedId);
      }
    } catch (error) {
      // Silently handle errors during auto-refresh to avoid disrupting UX
      console.log('Auto-refresh skipped due to network/API error:', error);
    }
  };

  // Fetch initial allocated IDs on mount
  useEffect(() => {
    refreshData();

    // Update current time every second
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
    }, 1000);

    // Auto refresh data every 10 seconds
    const refreshInterval = setInterval(() => {
      refreshData();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
    };
  }, []);

  // Clock In: Allocate a new ID
  const handleClockIn = async (e?: React.MouseEvent<HTMLButtonElement>, forceNewAllocation: boolean = false) => {
    if (allocatedId !== null && !forceNewAllocation) {
      setErrorMessage('您已申请到分机号，请尝试签入。');
      return;
    }
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allocate', forceNewAllocation }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setAllocatedId(data.id);
        setUniqueSessionId(data.uniqueId);
        setErrorMessage(null);
        // Copy the allocated ID to clipboard
        try {
          await copyToClipboard(data.id.toString());
          console.log(`ID ${data.id} copied to clipboard`);
        } catch (clipboardError) {
          console.log('Failed to copy to clipboard:', clipboardError);
        }
        // Update allocatedIds list
        const newAllocatedIds = [...allocatedIds, { id: data.id, ipAddress: data.ipAddress }];
        setAllocatedIds(newAllocatedIds.filter((idInfo, index, self) =>
          self.findIndex(t => t.id === idInfo.id) === index
        ));
        // Update stats by calling refreshData but preserve the current allocatedId
        const currentAllocatedId = data.id;
        try {
          const res = await fetch('/api/id-allocation');
          if (res.ok) {
            const statsData = await res.json();
            if (statsData.totalPoolIds !== undefined) setTotalIds(statsData.totalPoolIds);
            if (statsData.availableIds !== undefined) setAvailableIds(statsData.availableIds);
            if (statsData.disabledIds !== undefined) setDisabledIds(statsData.disabledIds);
            if (statsData.allocatedIdsCount !== undefined) setAllocatedIdsCount(statsData.allocatedIdsCount);
            if (statsData.allocatedIds) setAllocatedIds(statsData.allocatedIds);
            // Preserve the allocatedId we just set
            setAllocatedId(currentAllocatedId);
          }
        } catch (e) {
          console.error('Failed to refresh stats:', e);
        }
      } else {
        setErrorMessage(data.error || 'Allocation failed');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Clock Out: Release current ID
  const handleClockOut = async () => {
    if (allocatedId === null) return;
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release', id: allocatedId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setAllocatedId(null);
        setUniqueSessionId(null);
        setErrorMessage(null);
        setAllocatedIds(allocatedIds.filter(idInfo => idInfo.id !== allocatedId));
        // Update stats
        try {
          const res = await fetch('/api/id-allocation');
          if (res.ok) {
            const statsData = await res.json();
            if (statsData.totalPoolIds !== undefined) setTotalIds(statsData.totalPoolIds);
            if (statsData.availableIds !== undefined) setAvailableIds(statsData.availableIds);
            if (statsData.disabledIds !== undefined) setDisabledIds(statsData.disabledIds);
            if (statsData.allocatedIdsCount !== undefined) setAllocatedIdsCount(statsData.allocatedIdsCount);
            if (statsData.allocatedIds) setAllocatedIds(statsData.allocatedIds);
            // allocatedId is already set to null above
          }
        } catch (e) {
          console.error('Failed to refresh stats:', e);
        }
      } else {
        setErrorMessage(data.error || 'Release failed');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Clear All: Reset all allocated IDs (requires admin)
  const handleClearAll = async (adminSessionId: string) => {
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSessionId
        },
        body: JSON.stringify({ action: 'clearAll' }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setAllocatedIds([]);
        setAllocatedId(null);
        setUniqueSessionId(null);
        setErrorMessage(null);
        // Update stats
        try {
          const res = await fetch('/api/id-allocation');
          if (res.ok) {
            const statsData = await res.json();
            if (statsData.totalPoolIds !== undefined) setTotalIds(statsData.totalPoolIds);
            if (statsData.availableIds !== undefined) setAvailableIds(statsData.availableIds);
            if (statsData.disabledIds !== undefined) setDisabledIds(statsData.disabledIds);
            if (statsData.allocatedIdsCount !== undefined) setAllocatedIdsCount(statsData.allocatedIdsCount);
            if (statsData.allocatedIds) setAllocatedIds(statsData.allocatedIds);
          }
        } catch (e) {
          console.error('Failed to refresh stats:', e);
        }
      } else {
        setErrorMessage(data.error || 'Clear all failed');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Upload Employee Pool from a text file (requires admin)
  const uploadEmployeePool = async (file: File, adminSessionId: string) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target?.result as string;
      try {
        const response = await fetch('/api/id-allocation', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'x-admin-session': adminSessionId
          },
          body: fileContent,
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) {
          setErrorMessage(null);
          let message = `成功导入 ${data.uploadedCount} 个分机号。`;
          if (data.failedCount > 0) {
            message += `\n失败 ${data.failedCount} 个。`;
            if (data.errors && data.errors.length > 0) {
              message += `\n错误详情:\n${data.errors.slice(0, 5).join('\n')}${data.errors.length > 5 ? '\n...' : ''}`;
            }
          }
          alert(message);
          // Update stats
          try {
            const res = await fetch('/api/id-allocation');
            if (res.ok) {
              const statsData = await res.json();
              if (statsData.totalPoolIds !== undefined) setTotalIds(statsData.totalPoolIds);
              if (statsData.availableIds !== undefined) setAvailableIds(statsData.availableIds);
              if (statsData.disabledIds !== undefined) setDisabledIds(statsData.disabledIds);
              if (statsData.allocatedIdsCount !== undefined) setAllocatedIdsCount(statsData.allocatedIdsCount);
              if (statsData.allocatedIds) setAllocatedIds(statsData.allocatedIds);
            }
          } catch (e) {
            console.error('Failed to refresh stats:', e);
          }
        } else {
          setErrorMessage(data.error || 'Upload failed');
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file');
    };
    reader.readAsText(file);
  };

  return {
    allocatedIds,
    allocatedId,
    uniqueSessionId,
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
  };
};
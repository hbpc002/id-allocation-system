"use client";

import { useState, useEffect } from 'react';

interface AllocatedIdInfo {
  id: number;
  ipAddress: string;
}

export const useIdAllocation = () => {
  const [allocatedIds, setAllocatedIds] = useState<AllocatedIdInfo[]>([]);
  const [allocatedId, setAllocatedId] = useState<number | null>(null);
  const [uniqueSessionId, setUniqueSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [totalIds, setTotalIds] = useState<number>(0);
  const remainingIds = totalIds - allocatedIds.length;

  // Refresh allocated IDs and total pool count from the server
  const refreshData = async () => {
    try {
      const res = await fetch('/api/id-allocation');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.allocatedIds) {
        setAllocatedIds(data.allocatedIds);
      }
      if (data.totalPoolIds !== undefined) {
        setTotalIds(data.totalPoolIds);
      }
    } catch (error) {
      console.error('Failed to fetch allocated IDs:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Fetch initial allocated IDs on mount
  useEffect(() => {
    refreshData();

    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Clock In: Allocate a new ID
  const handleClockIn = async (e?: React.MouseEvent<HTMLButtonElement>, forceNewAllocation: boolean = false) => {
    if (allocatedId !== null && !forceNewAllocation) {
      setErrorMessage('您已申请到工号，请尝试签入。');
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
        // Use the ipAddress from the response, not a potentially undefined variable
        const newAllocatedIds = [...allocatedIds, { id: data.id, ipAddress: data.ipAddress }];
        setAllocatedIds(newAllocatedIds.filter((idInfo, index, self) =>
          self.findIndex(t => t.id === idInfo.id) === index
        ));
      } else {
        setErrorMessage(data.error || 'Allocation failed');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Clock Out: Release current ID
  const handleClockOut = async (e?: React.MouseEvent<HTMLButtonElement>) => {
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
        // Remove from local state
        setAllocatedIds(allocatedIds.filter(idInfo => idInfo.id !== allocatedId));
      } else {
        setErrorMessage(data.error || 'Release failed');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Reapply: Release current ID and allocate a new one
  const handleReapply = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (allocatedId !== null) {
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
          // Remove from local state
          setAllocatedIds(allocatedIds.filter(idInfo => idInfo.id !== allocatedId));
        } else {
          setErrorMessage(data.error || 'Release failed');
          return;
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        return;
      }
    }
    await handleClockIn(e, true);
  };

  // Clear All: Reset all allocated IDs
  const handleClearAll = async () => {
    try {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAll' }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setAllocatedIds([]);
        setAllocatedId(null);
        setUniqueSessionId(null);
        setErrorMessage(null);
      } else {
        setErrorMessage(data.error || 'Clear all failed');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Upload Employee Pool from a text file
  const uploadEmployeePool = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target?.result as string;
      try {
        const response = await fetch('/api/id-allocation', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: fileContent,
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) {
          setErrorMessage(null);
          alert(`Successfully uploaded ${data.uploadedCount} IDs.`);
          // Update totalIds immediately from response
          if (data.totalPoolIds !== undefined) {
            setTotalIds(data.totalPoolIds);
          }
          // Refresh data to ensure consistency (e.g., allocatedIds)
          await refreshData();
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
    remainingIds,
    handleClockIn,
    handleClockOut,
    handleReapply,
    handleClearAll,
    uploadEmployeePool,
  };
};
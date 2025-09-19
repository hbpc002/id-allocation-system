"use client";
import React, { useState, useEffect } from 'react';

const IdAllocationUI = () => {
  console.log('Component mounted');
  console.log('Component mounted');
  console.log('Component mounted');
  console.log('Component mounted');
  console.log('Component mounted');
  console.log('Component mounted');
  console.log('IdAllocationUI component mounted');
  console.log('IdAllocationUI component mounted');
  console.log('IdAllocationUI component mounted');
  console.log('IdAllocationUI component mounted');

  // Fetch initial allocated ID on component mount
  useEffect(() => {
    const fetchAllocatedIds = async () => {
      try {
        console.log('Fetching allocated IDs');
        console.log('Fetching allocated IDs');
        console.log('Fetching allocated IDs');
        console.log('Fetching allocated IDs');
        const res = await fetch('/api/id-allocation');
        console.log('Fetched data:', res.status);
        const data = await response.json();
        if (data.allocatedIds) {
          console.log('Fetched allocated IDs:', data.allocatedIds);
          console.log('Fetched allocated IDs:', data.allocatedIds);
          console.log('Fetched allocated IDs:', data.allocatedIds);
          console.log('Fetched allocated IDs:', data.allocatedIds);
          setAllocatedIds(data.allocatedIds);
          console.log('State updated with allocated IDs:', data.allocatedIds);
          console.log('State updated with allocated IDs:', data.allocatedIds);
          console.log('State updated with allocated IDs:', data.allocatedIds);
          console.log('State updated with allocated IDs:', data.allocatedIds);
          setTotalIds(644400 - 644100 + 1);
          console.log('Total IDs set to:', 644400 - 644100 + 1);
          console.log('Total IDs set to:', 644400 - 644100 + 1);
          console.log('Total IDs set to:', 644400 - 644100 + 1);
          console.log('Total IDs set to:', 644400 - 644100 + 1);
          setRemainingIds(totalIds - data.allocatedIds.length);
          console.log('Remaining IDs set to:', totalIds - data.allocatedIds.length);
          console.log('Remaining IDs set to:', totalIds - data.allocatedIds.length);
          console.log('Remaining IDs set to:', totalIds - data.allocatedIds.length);
          console.log('Remaining IDs set to:', totalIds - data.allocatedIds.length);
        }
      } catch (error) {
        console.error('Failed to fetch allocated IDs:', error);
      }
    };
    fetchAllocatedIds();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track allocatedIds changes
  useEffect(() => {
    console.log('Current allocatedIds state:', allocatedIds);
  }, [allocatedIds]);

  useEffect(() => {
    console.log('Current allocatedIds state:', allocatedIds);
  }, [allocatedIds]);

  const handleClockIn = async () => {
    const ipAddress = '127.0.0.1'; // Placeholder, ideally fetched from a client-side utility or API
    try {
      console.log('Allocating ID for:', ipAddress);
      const allocRes = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allocate', ipAddress })
      });
      const allocData = await allocRes.json();
      console.log('Allocation result:', allocData);
      if (allocData.success) {
        setAllocatedId(allocData.id);
        setUniqueSessionId(allocData.uniqueId);
        setErrorMessage(null);
        const newAllocatedIds = [...allocatedIds, { id: allocData.id, ipAddress }];
        setAllocatedIds(newAllocatedIds.filter((idInfo, index, self) => self.findIndex(t => t.id === idInfo.id) === index));
        setRemainingIds(totalIds - newAllocatedIds.length);
        console.log('Remaining IDs updated to:', totalIds - newAllocatedIds.length);
      } else {
        setErrorMessage(allocData.error);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'allocate', ipAddress})
      });
      const allocData = await allocRes.json();
      console.log('Allocation result:', allocData);
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allocate', ipAddress }),
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allocate', ipAddress }),
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      const response = await fetch('/api/id-allocation', {
      const response = await fetch('/api/id-allocation', {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allocate', ipAddress }),
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'allocate', ipAddress }),
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      const data = await response.json();
      console.log('Response data:', data);
      if (releaseData.success) {
        console.log('ID release successful:', releaseData);
        setAllocatedId(null);
        console.log('Allocated ID cleared');
        setUniqueSessionId(null);
        console.log('Unique Session ID cleared');
        setErrorMessage(null);
        console.log('Error message cleared');
        console.log('ID allocation successful:', data);
        setAllocatedId(data.id);
        console.log('Allocated ID set to:', data.id);
        setUniqueSessionId(data.uniqueId);
        console.log('Unique Session ID set to:', data.uniqueId);
        setErrorMessage(null);
        console.log('Error message cleared');
        const newAllocatedIds = [...allocatedIds, { id: data.id, ipAddress }];
        console.log('New allocated IDs:', newAllocatedIds);
        setAllocatedIds(newAllocatedIds.filter((idInfo, index, self) => self.findIndex(t => t.id === idInfo.id) === index));
        console.log('State updated with new allocated IDs:', newAllocatedIds);
        console.log('ID release successful:', data);
        setAllocatedId(null);
        console.log('Allocated ID cleared');
        setUniqueSessionId(null);
        console.log('Unique Session ID cleared');
        setErrorMessage(null);
        console.log('Error message cleared');
        console.log('ID allocation successful:', data);
        setAllocatedId(data.id);
        console.log('Allocated ID set to:', data.id);
        setUniqueSessionId(data.uniqueId);
        console.log('Unique Session ID set to:', data.uniqueId);
        setErrorMessage(null);
        console.log('Error message cleared');
        const newAllocatedIds = [...allocatedIds, { id: data.id, ipAddress }];
        console.log('New allocated IDs:', newAllocatedIds);
        setAllocatedIds(newAllocatedIds.filter((idInfo, index, self) => self.findIndex(t => t.id === idInfo.id) === index));
        console.log('State updated with new allocated IDs:', newAllocatedIds);
        console.log('ID allocation successful:', data);
        setAllocatedId(data.id);
        console.log('Allocated ID set to:', data.id);
        setUniqueSessionId(data.uniqueId);
        console.log('Unique Session ID set to:', data.uniqueId);
        setErrorMessage(null);
        console.log('Error message cleared');
        const newAllocatedIds = [...allocatedIds, { id: data.id, ipAddress }];
        console.log('New allocated IDs:', newAllocatedIds);
        setAllocatedIds(newAllocatedIds.filter((idInfo, index, self) => self.findIndex(t => t.id === idInfo.id) === index));
        console.log('State updated with new allocated IDs:', newAllocatedIds);
        console.log('ID allocation successful:', data);
        setAllocatedId(data.id);
        console.log('Allocated ID set to:', data.id);
        setUniqueSessionId(data.uniqueId);
        console.log('Unique Session ID set to:', data.uniqueId);
        setErrorMessage(null);
        console.log('Error message cleared');
        const newAllocatedIds = [...allocatedIds, { id: data.id, ipAddress }];
        console.log('New allocated IDs:', newAllocatedIds);
        setAllocatedIds(newAllocatedIds.filter((idInfo, index, self) => self.findIndex(t => t.id === idInfo.id) === index));
        console.log('State updated with new allocated IDs:', newAllocatedIds);
      } else {
        console.log('Clearing all IDs failed:', clearData.error);
        setErrorMessage(clearData.error);
        console.log('Error message set to:', clearData.error);
        console.log('ID release failed:', data.error);
        setErrorMessage(data.error);
        console.log('Error message set to:', data.error);
        console.log('ID allocation failed:', data.error);
        setErrorMessage(data.error);
        console.log('Error message set to:', data.error);
        console.log('ID allocation failed:', data.error);
        setErrorMessage(data.error);
        console.log('Error message set to:', data.error);
        console.log('ID allocation failed:', data.error);
        setErrorMessage(data.error);
        console.log('Error message set to:', data.error);
      }
    } catch (error: any) {
      console.error('Error allocating ID:', error);
      setErrorMessage(error.message);
    }
  };

  const handleClockOut = async () => {
    if (allocatedId !== null) {
      try {
        const response = await fetch('/api/id-allocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'release', id: allocatedId }),
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'release', id: allocatedId }),
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        if (data.success) {
          console.log('All IDs cleared successfully:', data);
          setAllocatedIds([]);
          console.log('Allocated IDs cleared');
          setTotalIds(644400 - 644100 + 1);
          console.log('Total IDs reset to:', 644400 - 644100 + 1);
          setRemainingIds(totalIds);
          console.log('Remaining IDs reset to:', totalIds);
          console.log('ID release successful:', data);
          setAllocatedId(null);
          console.log('Allocated ID cleared');
          setUniqueSessionId(null);
          console.log('Unique Session ID cleared');
          setErrorMessage(null);
          console.log('Error message cleared');
          console.log('ID release successful:', data);
          setAllocatedId(null);
          console.log('Allocated ID cleared');
          setUniqueSessionId(null);
          console.log('Unique Session ID cleared');
          setErrorMessage(null);
          console.log('Error message cleared');
        } else {
          console.log('Clearing all IDs failed:', data.error);
          setErrorMessage(data.error);
          console.log('Error message set to:', data.error);
          console.log('ID release failed:', data.error);
          setErrorMessage(data.error);
          console.log('Error message set to:', data.error);
          console.log('ID release failed:', data.error);
          setErrorMessage(data.error);
          console.log('Error message set to:', data.error);
        }
      } catch (error: any) {
        setErrorMessage(error.message);
      }
    }
  };

  const handleReapply = async () => {
    await handleClockOut(); // Release current ID first
    await handleClockIn(); // Then allocate a new one
  };

  const handleClearAll = async () => {
    try {
      console.log('Clearing all IDs');
      const response = await fetch('/api/id-allocation', {
      const response = await fetch('/api/id-allocation', {
      const response = await fetch('/api/id-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAll' }),
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAll' }),
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      const data = await response.json();
      console.log('Response data:', data);
      if (data.success) {
        console.log('All IDs cleared successfully:', data);
        setAllocatedIds([]);
        console.log('Allocated IDs cleared');
        setTotalIds(644400 - 644100 + 1);
        console.log('Total IDs reset to:', 644400 - 644100 + 1);
        setRemainingIds(totalIds);
        console.log('Remaining IDs reset to:', totalIds);
        console.log('All IDs cleared successfully:', data);
        setAllocatedIds([]);
        console.log('Allocated IDs cleared');
        setTotalIds(644400 - 644100 + 1);
        console.log('Total IDs reset to:', 644400 - 644100 + 1);
        setRemainingIds(totalIds);
        console.log('Remaining IDs reset to:', totalIds);
      } else {
        console.log('Clearing all IDs failed:', data.error);
        setErrorMessage(data.error);
        console.log('Error message set to:', data.error);
        console.log('Clearing all IDs failed:', data.error);
        setErrorMessage(data.error);
        console.log('Error message set to:', data.error);
      }
    } catch (error: any) {
      console.error('Error clearing all IDs:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md text-center">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Temporary Employee ID Allocation System</h1>
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={handleClockIn}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Clock In
        </button>
        <button
          onClick={handleClockOut}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Clock Out
        </button>
        <button
          onClick={handleReapply}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Reapply
        </button>
      </div>
      <div className="mb-4">
        {allocatedIds.length > 0 ? (
          <div>
            <p className="text-xl text-gray-700 dark:text-gray-300">Total IDs: <span className="font-semibold text-blue-600 dark:text-blue-400">{totalIds}</span></p>
            <p className="text-xl text-gray-700 dark:text-gray-300">Remaining IDs: <span className="font-semibold text-blue-600 dark:text-blue-400">{remainingIds}</span></p>
            <ul className="mt-4">
              {allocatedIds.slice(-10).map((idInfo) => (
                {console.log('Rendering allocated ID:', idInfo.id)}
                <li key={idInfo.id} className="text-lg text-gray-600 dark:text-gray-400">
                {console.log('Rendering allocated ID:', idInfo.id)}
                <li key={idInfo.id} className="text-lg text-gray-600 dark:text-gray-400">
                <li key={idInfo.id} className="text-lg text-gray-600 dark:text-gray-400">
                  ID: {idInfo.id} - IP: {idInfo.ipAddress}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xl text-gray-700 dark:text-gray-300">No IDs allocated</p>
        )}
        {console.log('Current UI state:', allocatedIds)}
      </div>
      <div className="mb-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">Current Time: <span className="font-medium">{currentTime.toLocaleString()}</span></p>
      </div>
      <div className="mb-4">
        <button
          onClick={handleClearAll}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Clear All
        </button>
      </div>
      {errorMessage && <p className="text-red-500 text-sm mt-4">Error: {errorMessage}</p>}
    </div>
  );
};

export default IdAllocationUI;
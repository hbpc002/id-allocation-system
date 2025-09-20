"use client";

import React, { useState, useEffect } from 'react';
import { useIdAllocation } from './hooks/useIdAllocation';
import { IdAllocationForm } from './components/IdAllocationForm';
import { IdAllocationList } from './components/IdAllocationList';
import { IdAllocationStatus } from './components/IdAllocationStatus';

const IdAllocationUI = () => {
  const {
    allocatedIds,
    allocatedId,
    errorMessage,
    currentTime,
    totalIds,
    remainingIds,
    handleClockIn,
    handleClockOut,
    handleReapply,
    handleClearAll,
    uploadEmployeePool,
  } = useIdAllocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleLoginEvent = async (e: Event) => {
      try {
        console.log('Attempting to fetch login password from API');
        // Fetch the actual stored password from the database via API
        const response = await fetch('/api/passwords/login_password');
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch password. Status:', response.status, 'Response:', errorText);
          throw new Error('Failed to fetch password');
        }
        
        const { value: storedPassword } = await response.json();
        console.log('Successfully fetched password from API');
        // Get password from event detail
        const password = (e as CustomEvent<{ password: string }>).detail?.password;
        if (password === storedPassword) {
          setIsLoggedIn(true);
        } else {
          alert('Invalid password');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    };

    // Listen for login-trigger events with password
    document.addEventListener('login-trigger', handleLoginEvent);
    return () => {
      document.removeEventListener('login-trigger', handleLoginEvent);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md text-center">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        分机号分配系统
      </h1>
      
      {errorMessage && (
        <p className="text-red-500 text-sm mb-4">hey: {errorMessage}</p>
      )}

      {allocatedId !== null && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Your Allocated ID</p>
          <p className="text-4xl font-extrabold text-blue-800 dark:text-blue-300">{allocatedId}</p>
        </div>
      )}

      <>
        <IdAllocationForm
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          onReapply={handleReapply}
          onClearAll={handleClearAll}
          onUploadPool={uploadEmployeePool}
          isLoggedIn={isLoggedIn}
        />

        <IdAllocationStatus
          totalIds={totalIds}
          remainingIds={remainingIds}
          currentTime={currentTime}
        />

        <div className="mb-4">
          <IdAllocationList allocatedIds={allocatedIds} />
        </div>
      </>

    </div>
  );
};

export default IdAllocationUI;
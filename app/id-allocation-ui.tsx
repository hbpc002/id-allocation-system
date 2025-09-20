"use client";

import React from 'react';
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

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md text-center">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Temporary Employee ID Allocation System
      </h1>
      
      {allocatedId !== null && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Your Allocated ID</p>
          <p className="text-4xl font-extrabold text-blue-800 dark:text-blue-300">{allocatedId}</p>
        </div>
      )}

      <IdAllocationForm
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        onReapply={handleReapply}
        onClearAll={handleClearAll}
        onUploadPool={uploadEmployeePool}
      />

      <IdAllocationStatus
        totalIds={totalIds}
        remainingIds={remainingIds}
        currentTime={currentTime}
      />

      <div className="mb-4">
        <IdAllocationList allocatedIds={allocatedIds} />
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm mt-4">Error: {errorMessage}</p>
      )}
    </div>
  );
};

export default IdAllocationUI;
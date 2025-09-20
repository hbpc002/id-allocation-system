"use client";

import React from 'react';

interface IdAllocationStatusProps {
  totalIds: number;
  remainingIds: number;
  currentTime: Date;
}

export const IdAllocationStatus: React.FC<IdAllocationStatusProps> = ({
  totalIds,
  remainingIds,
  currentTime,
}) => {
  return (
    <div className="mb-4">
      <p className="text-xl text-gray-700 dark:text-gray-300">
        Total IDs: <span className="font-semibold text-blue-600 dark:text-blue-400">{totalIds}</span>
      </p>
      <p className="text-xl text-gray-700 dark:text-gray-300">
        Remaining IDs: <span className="font-semibold text-blue-600 dark:text-blue-400">{remainingIds}</span>
      </p>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Current Time: <span className="font-medium">{currentTime.toLocaleString()}</span>
      </p>
    </div>
  );
};
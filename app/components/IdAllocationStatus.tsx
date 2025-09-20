"use client";

import React from 'react';

interface IdAllocationStatusProps {
  totalIds: number;
  remainingIds: number;
  currentTime: Date;
}

// Format date consistently between server and client
const formatDateTime = (date: Date): string => {
  // Use UTC to ensure consistency between server and client
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

export const IdAllocationStatus: React.FC<IdAllocationStatusProps> = ({
  totalIds,
  remainingIds,
  currentTime,
}) => {
  return (
    <div className="mb-4">
      <p className="text-xl text-gray-700 dark:text-gray-300">
        工号总数: <span className="font-semibold text-blue-600 dark:text-blue-400">{totalIds}</span>
      </p>
      <p className="text-xl text-gray-700 dark:text-gray-300">
        剩余工号: <span className="font-semibold text-blue-600 dark:text-blue-400">{remainingIds}</span>
      </p>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Current Time: <span className="font-medium">{formatDateTime(currentTime)}</span>
      </p>
    </div>
  );
};
"use client";

import React from 'react';

interface IdAllocationStatusProps {
  totalIds: number;
  remainingIds: number;
  currentTime: Date;
}

// Format date to display in readable format
const formatDateTime = (date: Date): string => {
  // Format the date manually to avoid timezone conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
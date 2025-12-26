"use client";

import React from 'react';

interface IdAllocationStatusProps {
  totalIds: number;
  availableIds: number;
  disabledIds: number;
  allocatedIdsCount: number;
  currentTime: Date;
}

// Format date to display in readable format
const formatDateTime = (date: Date): string => {
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
  availableIds,
  disabledIds,
  allocatedIdsCount,
  currentTime,
}) => {
  return (
    <div className="mb-4 grid grid-cols-2 gap-4">
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
        <p className="text-sm text-gray-600 dark:text-gray-400">工号总数</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalIds}</p>
      </div>
      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
        <p className="text-sm text-green-700 dark:text-green-300">可用工号</p>
        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{availableIds}</p>
      </div>
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
        <p className="text-sm text-blue-700 dark:text-blue-300">已分配</p>
        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{allocatedIdsCount}</p>
      </div>
      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
        <p className="text-sm text-orange-700 dark:text-orange-300">已停用</p>
        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{disabledIds}</p>
      </div>
      <div className="col-span-2 p-2 text-center text-sm text-gray-600 dark:text-gray-400">
        当前时间: <span className="font-medium">{formatDateTime(currentTime)}</span>
      </div>
    </div>
  );
};
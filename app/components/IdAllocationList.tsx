"use client";

import React from 'react';

interface AllocatedIdInfo {
  id: number;
  ipAddress: string;
}

interface IdAllocationListProps {
  allocatedIds: AllocatedIdInfo[];
}

export const IdAllocationList: React.FC<IdAllocationListProps> = ({ allocatedIds }) => {
  if (allocatedIds.length === 0) {
    return <p className="text-xl text-gray-700 dark:text-gray-300">No IDs allocated</p>;
  }

  return (
    <div>
      <ul className="mt-4">
        {allocatedIds.slice(-10).map((idInfo) => (
          <li key={idInfo.id} className="text-lg text-gray-600 dark:text-gray-400">
            ID: {idInfo.id} - IP: {idInfo.ipAddress}
          </li>
        ))}
      </ul>
    </div>
  );
};
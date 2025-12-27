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
    <div className="mb-6 grid grid-cols-2 gap-3">
      <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-lg">
        <p className="text-xs text-slate-500 mb-1">工号总数</p>
        <p className="text-xl font-semibold text-slate-800">{totalIds}</p>
      </div>
      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg">
        <p className="text-xs text-emerald-600 mb-1">可用工号</p>
        <p className="text-xl font-semibold text-emerald-700">{availableIds}</p>
      </div>
      <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg">
        <p className="text-xs text-indigo-600 mb-1">已分配</p>
        <p className="text-xl font-semibold text-indigo-700">{allocatedIdsCount}</p>
      </div>
      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-600 mb-1">已停用</p>
        <p className="text-xl font-semibold text-amber-700">{disabledIds}</p>
      </div>
      <div className="col-span-2 p-2 text-center text-xs text-slate-500 bg-slate-50/50 border border-slate-100 rounded-lg">
        当前时间: <span className="font-medium text-slate-700">{formatDateTime(currentTime)}</span>
      </div>
    </div>
  );
};
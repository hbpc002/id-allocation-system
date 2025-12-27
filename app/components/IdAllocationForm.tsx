"use client";

import React from 'react';

interface IdAllocationFormProps {
  onClockIn: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClockOut: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClearAll: () => void;
  onUploadPool: (file: File) => void;
  isLoggedIn: boolean;
}

export const IdAllocationForm: React.FC<IdAllocationFormProps> = ({
  onClockIn,
  onClockOut,
  onClearAll,
  onUploadPool,
  isLoggedIn,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6">
      <button
        onClick={onClockIn}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow"
      >
        申请工号
      </button>
      <button
        onClick={onClockOut}
        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow"
      >
        释放工号
      </button>
      {isLoggedIn && (
        <>
          <button
            onClick={onClearAll}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow"
          >
            清空所有
          </button>
          <button
            onClick={() => document.getElementById('fileInput')?.click()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow"
          >
            上传工号池
          </button>
        </>
      )}
      <input
        id="fileInput"
        type="file"
        accept=".txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUploadPool(file);
            // Reset the input value so the same file can be selected again
            e.target.value = '';
          }
        }}
      />
    </div>
  );
};
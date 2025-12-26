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
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
      >
        申请工号
      </button>
      <button
        onClick={onClockOut}
        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
      >
        释放工号
      </button>
      {isLoggedIn && (
        <>
          <button
            onClick={onClearAll}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            清空所有
          </button>
          <button
            onClick={() => document.getElementById('fileInput')?.click()}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
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
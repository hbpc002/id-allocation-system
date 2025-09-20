"use client";

import React from 'react';

interface IdAllocationFormProps {
  onClockIn: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClockOut: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onReapply: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClearAll: () => void;
  onUploadPool: (file: File) => void;
  isLoggedIn: boolean;
}

export const IdAllocationForm: React.FC<IdAllocationFormProps> = ({
  onClockIn,
  onClockOut,
  onReapply,
  onClearAll,
  onUploadPool,
  isLoggedIn,
}) => {
  return (
    <div className="flex justify-center space-x-4 mb-6">
      <button
        onClick={onClockIn}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
      >
        Clock In
      </button>
      <button
        onClick={onClockOut}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
      >
        Clock Out
      </button>
      <button
        onClick={onReapply}
        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
      >
        Reapply
      </button>
      {isLoggedIn && (
        <>
          <button
            onClick={onClearAll}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Clear All
          </button>
          <button
            onClick={() => document.getElementById('fileInput')?.click()}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Upload Pool
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
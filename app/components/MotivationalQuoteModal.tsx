"use client";

import React from 'react';

interface MotivationalQuoteModalProps {
  quote: string;
  source: string;
  onClose: () => void;
}

const MotivationalQuoteModal: React.FC<MotivationalQuoteModalProps> = ({
  quote,
  source,
  onClose
}) => {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 cursor-pointer animate-slideInRight animate-colorCycle"
      onClick={onClose}
      style={{ maxWidth: '320px' }}
    >
      <div className="backdrop-blur-sm rounded-lg shadow-lg p-3">
        <div className="flex-1">
          <div className="text-base font-bold text-gray-900 mb-1 leading-snug">
            {quote}
          </div>
          <div className="text-xs text-gray-600 text-right italic">
            {source}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotivationalQuoteModal;

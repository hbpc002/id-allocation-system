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
      className="fixed bottom-4 right-4 z-50 cursor-pointer animate-bgCycle"
      onClick={onClose}
      style={{ maxWidth: '400px' }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-6 border-2 border-gray-900">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <div className="text-lg font-bold text-gray-900 mb-2 leading-relaxed">
              {quote}
            </div>
            <div className="text-sm text-gray-600 text-right italic">
              {source}
            </div>
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-gray-500">
          点击任意位置关闭
        </div>
      </div>
    </div>
  );
};

export default MotivationalQuoteModal;

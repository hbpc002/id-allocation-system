"use client";

import React, { useEffect, useState } from 'react';

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
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Create bounce animation phases
    const phases = [
      { transform: 'translateX(10px) scale(0.3)', opacity: 0 }, // Start
      { transform: 'translateX(-20px) scale(1.15)', opacity: 1 }, // Overshoot
      { transform: 'translateX(10px) scale(0.9)', opacity: 1 }, // Bounce back 1
      { transform: 'translateX(-5px) scale(1.05)', opacity: 1 }, // Bounce back 2
      { transform: 'translateX(3px) scale(0.98)', opacity: 1 }, // Bounce back 3
      { transform: 'translateX(0) scale(1)', opacity: 1 } // Final
    ];

    const durations = [0, 60, 90, 105, 120, 200]; // Timing in ms

    const timers = phases.slice(1).map((phase, index) => {
      return setTimeout(() => {
        setAnimationPhase(index + 1);
      }, durations[index + 1]);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [quote, source]); // Restart animation when quote changes

  const getAnimationStyle = () => {
    const phases = [
      { transform: 'translateX(400px) scale(0.3)', opacity: 0 },
      { transform: 'translateX(-30px) scale(1.15)', opacity: 1 },
      { transform: 'translateX(15px) scale(0.9)', opacity: 1 },
      { transform: 'translateX(-8px) scale(1.05)', opacity: 1 },
      { transform: 'translateX(3px) scale(0.98)', opacity: 1 },
      { transform: 'translateX(0) scale(1)', opacity: 1 }
    ];
    
    return phases[animationPhase];
  };

  return (
    <div
      key={`${quote}-${source}`}
      className="fixed bottom-4 right-4 z-50 cursor-pointer animate-colorCycle"
      onClick={onClose}
      style={{ 
        maxWidth: '340px',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        ...getAnimationStyle()
      }}
    >
      <div className="backdrop-blur-sm rounded-lg shadow-md p-4">
        <div className="flex-1">
          <div className="text-base font-bold text-white mb-1 leading-snug">
            {quote}
          </div>
          <div className="text-xs text-white/90 text-right italic">
            {source}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotivationalQuoteModal;

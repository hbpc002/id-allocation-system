"use client";

import React, { useEffect, useState, useRef } from 'react';

interface MotivationalQuoteModalProps {
  quote: string;
  source: string;
  fadeDelay?: number;
  onClose: () => void;
}

const MotivationalQuoteModal: React.FC<MotivationalQuoteModalProps> = ({
  quote,
  source,
  fadeDelay: propFadeDelay,
  onClose
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const fadeDelay = propFadeDelay ?? 5000;
  // Random color color-set for CSS-driven color cycling
  const COLOR_SET = ['#f59e0b', '#2563eb', '#059669', '#db2777', '#eab308', '#14b8a6'];
  // DOM ref for the modal element to update CSS variables
  const modalRef = useRef<HTMLDivElement | null>(null);
  function randomizeStops() {
    const el = modalRef.current;
    if (!el) return;
    const arr = Array.from({ length: 4 }, () => COLOR_SET[Math.floor(Math.random() * COLOR_SET.length)]);
    el.style.setProperty('--cc0', arr[0]);
    el.style.setProperty('--cc1', arr[1]);
    el.style.setProperty('--cc2', arr[2]);
    el.style.setProperty('--cc3', arr[3]);
  }
  // Preserve a stable reference to onClose to handle asynchronous calls safely
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    randomizeStops();
  }, []);

  // Unify with CSS-driven color cycle: apply random colors on animation iterations
  // Note: onAnimationIteration handler will update the CSS variables to a new random set

  useEffect(() => {
    console.log('[Quote] 组件挂载，fadeDelay:', fadeDelay);

    const phases = [
      { transform: 'translateX(10px) scale(0.3)' },
      { transform: 'translateX(-20px) scale(1.15)' },
      { transform: 'translateX(10px) scale(0.9)' },
      { transform: 'translateX(-5px) scale(1.05)' },
      { transform: 'translateX(3px) scale(0.98)' },
      { transform: 'translateX(0) scale(1)' }
    ];

    const durations = [0, 60, 90, 105, 120, 200];

    const timers = phases.slice(1).map((phase, index) => {
      return setTimeout(() => {
        setAnimationPhase(index + 1);
      }, durations[index + 1]);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    console.log('[Quote] 设置渐隐定时器，延迟:', fadeDelay, 'ms');

    const startFade = () => {
      console.log('[Quote] 开始渐隐');
      const fadeElement = document.getElementById('quote-modal');
      if (fadeElement) {
        fadeElement.style.transition = 'opacity 0.5s ease-in-out';
        fadeElement.style.opacity = '0';
        setTimeout(() => {
          console.log('[Quote] 渐隐完成，调用 onClose');
          // Use the ref to call the latest onClose without recreating the timer.
          onCloseRef.current();
        }, 500);
      }
    };

    const timer = setTimeout(startFade, fadeDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [fadeDelay]);

  // Color cycling handled by CSS animation (animate-colorCycle)

  const getAnimationStyle = () => {
    const phases = [
      { transform: 'translateX(400px) scale(0.3)' },
      { transform: 'translateX(-30px) scale(1.15)' },
      { transform: 'translateX(15px) scale(0.9)' },
      { transform: 'translateX(-8px) scale(1.05)' },
      { transform: 'translateX(3px) scale(0.98)' },
      { transform: 'translateX(0) scale(1)' }
    ];

    return phases[animationPhase];
  };

  return (
    <div
      id="quote-modal"
      ref={modalRef}
      key={`${quote}-${source}`}
      className={`fixed bottom-4 right-4 z-50 cursor-pointer animate-colorCycle`}
      onClick={onClose}
      onAnimationIteration={() => randomizeStops()}
      style={{
        maxWidth: '340px',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        opacity: 1,
        // color stops for dynamic CSS-based color cycling
        ['--cc0' as any]: COLOR_SET[0],
        ['--cc1' as any]: COLOR_SET[1],
        ['--cc2' as any]: COLOR_SET[2],
        ['--cc3' as any]: COLOR_SET[3],
        ...getAnimationStyle()
      } as React.CSSProperties}
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

import React from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  seconds: number;
  totalSeconds: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  seconds, 
  totalSeconds, 
  size = 'md' 
}) => {
  const safeTotal = Math.max(1, totalSeconds);
  const percentage = Math.max(0, Math.min(100, (seconds / safeTotal) * 100));

  // Determine urgency
  const isUrgent = seconds <= 5 && seconds > 0;
  const isCritical = seconds <= 2 && seconds > 0;

  // Dimensions
  const dims = {
    sm: { size: 64, stroke: 4, text: 'text-lg', label: 'text-[9px]' },
    md: { size: 100, stroke: 6, text: 'text-3xl', label: 'text-xs' },
    lg: { size: 140, stroke: 8, text: 'text-5xl', label: 'text-sm' },
    hero: { size: 180, stroke: 10, text: 'text-6xl', label: 'text-base' }
  }[size];

  const radius = (dims.size - dims.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = '#D6B36A'; // Gold
  if (seconds <= 3) strokeColor = '#FF5C5C'; // Danger
  else if (seconds <= 6) strokeColor = '#FDB022'; // Warning

  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.div 
        animate={isCritical ? { scale: [1, 1.06, 1] } : isUrgent ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
        className="relative"
        style={{ width: dims.size, height: dims.size }}
      >
        <svg 
          className="w-full h-full -rotate-90 transform"
          viewBox={`0 0 ${dims.size} ${dims.size}`}
        >
          {/* Background track */}
          <circle
            cx={dims.size / 2}
            cy={dims.size / 2}
            r={radius}
            stroke="#1F232D"
            strokeWidth={dims.stroke}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={dims.size / 2}
            cy={dims.size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={dims.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease',
              filter: isUrgent ? `drop-shadow(0 0 10px ${strokeColor})` : 'none',
            }}
          />
        </svg>

        {/* Center Countdown Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={`font-display font-bold tabular-nums tracking-tight ${dims.text}`}
            style={{ color: strokeColor }}
          >
            {seconds}
          </span>
          <span className={`text-text-muted font-semibold uppercase tracking-wider ${dims.label}`}>
            sec
          </span>
        </div>
      </motion.div>
    </div>
  );
};

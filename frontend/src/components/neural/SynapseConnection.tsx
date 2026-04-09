import React from 'react';
import { motion } from 'framer-motion';

export interface SynapseConnectionProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  status: 'idle' | 'flowing' | 'complete';
  colorHex?: string;
  className?: string;
}

export function SynapseConnection({
  startX,
  startY,
  endX,
  endY,
  status,
  colorHex = '#ffffff',
  className
}: SynapseConnectionProps) {
  const isFlowing = status === 'flowing';
  const isComplete = status === 'complete';
  
  // SVG line path
  const pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
  
  return (
    <svg 
      className={`absolute inset-0 pointer-events-none overflow-visible ${className || ''}`}
      style={{ zIndex: 0 }}
    >
      {/* Base dashed line (idle/background) */}
      <path 
        d={pathData} 
        stroke="rgba(255, 255, 255, 0.06)" 
        strokeWidth="1.5" 
        strokeDasharray="4 4"
        fill="none" 
      />

      {/* Complete or Flowing Line (glow effect) */}
      {(isFlowing || isComplete) && (
        <path 
          d={pathData} 
          stroke={colorHex} 
          strokeWidth="2" 
          strokeOpacity={isComplete ? 0.15 : 0.3}
          fill="none" 
          className="transition-all duration-500"
        />
      )}

      {/* Traveling Particle during Flowing */}
      {isFlowing && (
        <motion.circle
          r="3"
          fill={colorHex}
          style={{
            boxShadow: `0 0 10px ${colorHex}`,
            filter: 'drop-shadow(0px 0px 4px currentColor)'
          }}
          initial={{ cx: startX, cy: startY, opacity: 0 }}
          animate={{
            cx: endX,
            cy: endY,
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1], // Expo.out
            repeat: Infinity,
            repeatDelay: 0.2
          }}
        />
      )}
    </svg>
  );
}